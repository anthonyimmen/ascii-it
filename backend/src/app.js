import 'dotenv/config'
import express from 'express'
import cors from 'cors'

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

export default app;
