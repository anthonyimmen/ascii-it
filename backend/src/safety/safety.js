// Pluggable safety filter
// Uses Google Cloud Vision SafeSearch if available; otherwise allows by default (lenient)
import vision from '@google-cloud/vision';

let visionClient = null;
try {
  visionClient = new vision.ImageAnnotatorClient();
} catch {}

// Threshold helper
const levelToScore = (label) => {
  const map = { VERY_UNLIKELY: 0, UNLIKELY: 1, POSSIBLE: 2, LIKELY: 3, VERY_LIKELY: 4 };
  return map[label] ?? 0;
};

export async function runSafetyChecks(buffer) {
  const mode = (process.env.SAFETY_MODE || 'lenient').toLowerCase();
  if (mode === 'off') return { allowed: true, reason: 'safety_off' };

  if (!visionClient) {
    // No Vision client available; lenient if not strict
    if (mode === 'strict') return { allowed: false, reason: 'safety_unavailable' };
    return { allowed: true, reason: 'safety_not_configured' };
  }

  try {
    const [result] = await visionClient.safeSearchDetection({ image: { content: buffer } });
    const safe = result.safeSearchAnnotation || {};
    const categories = [
      ['adult', safe.adult],
      ['violence', safe.violence],
      ['racy', safe.racy],
      ['medical', safe.medical],
      ['spoof', safe.spoof],
    ];

    const maxScore = Math.max(...categories.map(([, v]) => levelToScore(v)));
    const threshold = mode === 'strict' ? 1 : 3; // strict rejects UNLIKELY+ (>=1), lenient rejects LIKELY+ (>=3)
    const allowed = maxScore < threshold;
    return { allowed, reason: allowed ? 'pass' : 'safe_search_violation', details: categories };
  } catch (e) {
    if (mode === 'strict') return { allowed: false, reason: 'safety_error' };
    return { allowed: true, reason: 'safety_error_lenient' };
  }
}

