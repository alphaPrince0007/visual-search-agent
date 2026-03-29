import "dotenv/config";
import { validateEnv } from "./env-check";

// ── Validate all required env vars before anything else loads ──────────────
console.log("\n── Environment Check ─────────────────────────────────────────");
validateEnv();

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

import pinoHttp from "pino-http";
import { logger } from "./logger";
import { apiRateLimiter, searchRateLimiter } from "./rate-limit";
import { errorHandler } from "./error-handler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── 1. Structured HTTP request logging ─────────────────────────────────────
  app.use(pinoHttp({
    logger,
    // Skip logging for Vite HMR and static asset requests in development
    autoLogging: {
      ignore: (req) => Boolean(req.url?.startsWith("/@") || req.url?.endsWith(".map")),
    },
  }));

  // ── 2. Body parsing ────────────────────────────────────────────────────────
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── 3. Rate limiting ───────────────────────────────────────────────────────
  app.use("/api", apiRateLimiter);                           // 100 req / 15 min
  app.use("/api/trpc/visualSearch.initiateSearch", searchRateLimiter); // 10 req / 15 min

  // ── 4. Routes ──────────────────────────────────────────────────────────────
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // ── 5. Vite (dev) / static (prod) ─────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ── 6. Global error handler (must be last) ─────────────────────────────────
  app.use(errorHandler);

  // ── 7. Start listening ─────────────────────────────────────────────────────
  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port =
    process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (
    process.env.NODE_ENV !== "production" &&
    port !== preferredPort
  ) {
    logger.warn({ preferredPort, port }, "Preferred port busy, using alternate");
  }

  server.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV }, "Server started");
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Fatal error during server startup");
  process.exit(1);
});

