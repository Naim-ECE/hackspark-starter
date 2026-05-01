const WINDOW_MS = 60 * 1000;
const MAX_REQS = 30;

const buckets = new Map();

export default function rateLimiter(req, res, next) {
  const now = Date.now();
  const ip = req.ip || "unknown";
  const bucket = buckets.get(ip) || { count: 0, start: now };

  if (now - bucket.start > WINDOW_MS) {
    bucket.count = 0;
    bucket.start = now;
  }

  bucket.count += 1;
  buckets.set(ip, bucket);

  if (bucket.count > MAX_REQS) {
    return res.status(429).json({
      error: {
        message: "Too many requests",
        status: 429
      }
    });
  }

  return next();
}
