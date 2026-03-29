import pino from "pino";
import { ENV } from "./env";

/**
 * Singleton structured logger (pino).
 *
 * - Development: pretty-prints with colour via pino-pretty transport
 * - Production:  emits raw JSON for log aggregators (Datadog, CloudWatch, etc.)
 *
 * Usage:
 *   import { logger } from "./_core/logger";
 *   logger.info({ searchId: 1 }, "Search initiated");
 *   logger.error({ err }, "Unhandled error");
 */
export const logger = pino(
  {
    level: ENV.isProduction ? "info" : "debug",
    base: { service: "visual-search-agent" },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact secrets that may slip into log objects
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.apiKey",
        "*.openAiKey",
        "*.serpApiKey",
        "*.googleApiKey",
      ],
      censor: "[REDACTED]",
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  },
  ENV.isProduction
    ? pino.destination({ sync: false }) // async writes for production throughput
    : pino.transport({ target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } })
);
