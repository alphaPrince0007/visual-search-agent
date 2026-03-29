import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

/**
 * Maps a TRPCError code to an appropriate HTTP status code.
 */
function trpcCodeToStatus(code: TRPCError["code"]): number {
  const map: Record<string, number> = {
    PARSE_ERROR:        400,
    BAD_REQUEST:        400,
    UNAUTHORIZED:       401,
    FORBIDDEN:          403,
    NOT_FOUND:          404,
    METHOD_NOT_SUPPORTED: 405,
    TIMEOUT:            408,
    CONFLICT:           409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE:  413,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS:  429,
    CLIENT_CLOSED_REQUEST: 499,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED:    501,
  };
  return map[code] ?? 500;
}

/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express middleware chain (4-argument signature).
 *
 * Handles:
 *  - ZodError      → 400 with field-level validation messages
 *  - TRPCError     → mapped HTTP status
 *  - Generic Error → 500 (message hidden in production)
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    logger.warn({ err: err.flatten(), path: req.path }, "Request validation failed");
    res.status(400).json({
      success: false,
      error: "Validation error",
      issues: err.flatten().fieldErrors,
    });
    return;
  }

  // ── tRPC errors (surfaced outside the tRPC adapter) ───────────────────────
  if (err instanceof TRPCError) {
    const status = trpcCodeToStatus(err.code);
    logger.warn({ code: err.code, path: req.path }, err.message);
    res.status(status).json({ success: false, error: err.message });
    return;
  }

  // ── Generic / unexpected errors ───────────────────────────────────────────
  const error = err instanceof Error ? err : new Error(String(err));

  logger.error(
    { err: { message: error.message, stack: error.stack }, path: req.path, method: req.method },
    "Unhandled server error"
  );

  const isProd = process.env.NODE_ENV === "production";

  res.status(500).json({
    success: false,
    error: isProd ? "Internal server error" : error.message,
    ...(isProd ? {} : { stack: error.stack }),
  });
}

/**
 * Catches async route handler rejections that would otherwise be unhandled.
 * Wraps an async Express handler and forwards errors to next().
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
