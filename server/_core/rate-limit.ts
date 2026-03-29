import { rateLimit } from "express-rate-limit";
import { logger } from "./logger";

/**
 * General API rate limiter — applied to all /api/* routes.
 * 100 requests per 15-minute window per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-7", // Emit `RateLimit-*` headers (RFC 6585 draft)
  legacyHeaders: false,
  message: { success: false, error: "Too many requests — please retry later." },
  handler(req, res, _next, options) {
    logger.warn(
      { ip: req.ip, path: req.path },
      "Rate limit exceeded"
    );
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Stricter limiter for heavyweight AI endpoints (image upload / search initiation).
 * 10 requests per 15-minute window per IP — protects Gemini & SerpAPI quotas.
 */
export const searchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "Search rate limit exceeded — please wait before submitting another image." },
  handler(req, res, _next, options) {
    logger.warn(
      { ip: req.ip, path: req.path },
      "Search rate limit exceeded"
    );
    res.status(options.statusCode).json(options.message);
  },
});
