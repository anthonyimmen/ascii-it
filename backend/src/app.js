import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { adminAuth, adminStorage } from './firebaseAdmin.js'
import { runSafetyChecks } from './safety/safety.js'

const app = express();

// CORS middleware (restrict origins via env)
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true); // non-browser or same-origin
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Origin','X-Requested-With','Content-Type','Accept','Authorization'],
  maxAge: 86400,
}));
app.use((req,res,next)=>{ res.setHeader('Vary','Origin'); next(); });

app.use(express.json());

// Basic health endpoints to aid platform readiness checks
app.get('/', (_req, res) => res.status(200).send('ok'));
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));

// Multer in-memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- Twitter profile fetch (server-side) ---
function getHighResProfileImageUrl(url) {
  try {
    let out = url || '';
    out = out.replace(/_normal(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    out = out.replace(/_mini(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    out = out.replace(/_bigger(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    out = out.replace(/([?&])name=(normal|bigger|mini)(&|$)/, '$1name=400x400$3');
    return out;
  } catch {
    return url;
  }
}
function getHighResBannerUrl(url) {
  try {
    if (!url) return url;
    if (/\/\d+x\d+(\?|$)/.test(url)) {
      return url.replace(/\/\d+x\d+(\?|$)/, '/1500x500$1');
    }
    if (/\.(jpg|png)(\?.*)?$/.test(url)) {
      const [base, query = ''] = url.split('?');
      return `${base}/1500x500${query ? `?${query}` : ''}`;
    }
    return url.endsWith('/') ? `${url}1500x500` : `${url}/1500x500`;
  } catch {
    return url;
  }
}

app.get('/api/twitter/:username', async (req, res) => {
  try {
    const username = (req.params.username || '').trim();
    if (!username) return res.status(400).json({ error: 'missing_twitter_username' });
    const apiKey = process.env.SOCIAL_DATA_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'twitter_api_key_not_configured' });

    const resp = await fetch(`https://api.socialdata.tools/twitter/user/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return res.status(502).json({ error: 'twitter_fetch_failed', status: resp.status, body: txt });
    }
    const data = await resp.json();
    const profileRaw = data?.profile_image_url_https || data?.profile_image_url || null;
    const bannerRaw = data?.profile_banner_url || null;
    const profileUrl = profileRaw ? getHighResProfileImageUrl(profileRaw) : null;
    const bannerUrl = bannerRaw ? getHighResBannerUrl(bannerRaw) : null;

    // Cache for a short time to reduce API usage
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json({ profileUrl, bannerUrl });
  } catch (e) {
    console.error('twitter profile fetch error', e);
    return res.status(500).json({ error: 'twitter_profile_error' });
  }
});

// Auth middleware: verify Firebase ID token from Authorization header
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// PUT /api/images (regular single upload)
app.put('/api/images', verifyAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'missing_file' });
    const uid = req.user.uid;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const original = req.file.originalname || 'ascii-image.png';
    const safe = await runSafetyChecks(req.file.buffer);
    if (!safe.allowed) return res.status(400).json({ error: 'unsafe_image', reason: safe.reason });

    const bucket = adminStorage.bucket();
    const objectPath = `users/${uid}/ascii/${ts}-${original.replace(/\s+/g, '-')}`;
    const file = bucket.file(objectPath);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype || 'image/png', metadata: { uid, source: 'ascii-it' } },
      resumable: false,
    });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 365 });
    return res.json({ path: objectPath, url });
  } catch (e) {
    console.error('upload error', e);
    return res.status(500).json({ error: 'upload_failed' });
  }
});

// PUT /api/twitter-images (profile + banner)
app.put('/api/twitter-images', verifyAuth, upload.fields([{ name: 'profile' }, { name: 'banner' }]), async (req, res) => {
  try {
    const uid = req.user.uid;
    const username = (req.body.twitterUsername || '').toString().trim();
    if (!username) return res.status(400).json({ error: 'missing_twitter_username' });
    const files = req.files || {};
    const profile = Array.isArray(files.profile) ? files.profile[0] : null;
    const banner = Array.isArray(files.banner) ? files.banner[0] : null;
    if (!profile && !banner) return res.status(400).json({ error: 'no_files' });

    const bucket = adminStorage.bucket();
    const basePath = `users/${uid}/twitter/${username}`;
    const results = {};

    if (profile) {
      const safeP = await runSafetyChecks(profile.buffer);
      if (!safeP.allowed) return res.status(400).json({ error: 'unsafe_profile_image', reason: safeP.reason });
      const file = bucket.file(`${basePath}/profile.png`);
      await file.save(profile.buffer, { metadata: { contentType: profile.mimetype || 'image/png', metadata: { uid, username } }, resumable: false });
      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 365 });
      results.profile = { path: `${basePath}/profile.png`, url };
    }
    if (banner) {
      const safeB = await runSafetyChecks(banner.buffer);
      if (!safeB.allowed) return res.status(400).json({ error: 'unsafe_banner_image', reason: safeB.reason });
      const file = bucket.file(`${basePath}/banner.png`);
      await file.save(banner.buffer, { metadata: { contentType: banner.mimetype || 'image/png', metadata: { uid, username } }, resumable: false });
      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 365 });
      results.banner = { path: `${basePath}/banner.png`, url };
    }
    return res.json(results);
  } catch (e) {
    console.error('twitter upload error', e);
    return res.status(500).json({ error: 'upload_failed' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

