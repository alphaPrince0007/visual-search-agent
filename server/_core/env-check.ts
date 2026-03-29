import { ENV } from "./env";

// ─── Key definitions ──────────────────────────────────────────────────────────
// Each entry declares the key name, the value to check, and whether a missing
// key is fatal (critical) or only a warning.

interface KeySpec {
  name: string;
  value: string;
  critical: boolean;
  usedBy: string;
}

const KEY_SPECS: KeySpec[] = [
  {
    name: "DATABASE_URL",
    value: ENV.databaseUrl,
    critical: false,
    usedBy: "Drizzle ORM / all database queries",
  },
  {
    name: "OPENAI_API_KEY",
    value: ENV.openAiKey,
    critical: false,
    usedBy: "OpenAI SDK (optional; legacy)",
  },
  {
    name: "GEMINI_API_KEY / GOOGLE_API_KEY",
    value: ENV.geminiApiKey,
    critical: false,
    usedBy: "Gemini vision, refine, generate, invokeLLM, visual search analysis",
  },
  {
    name: "LLM_API_BASE_URL / OPENAI_BASE_URL",
    value: ENV.forgeApiUrl,
    critical: false,
    usedBy: "OpenAI-compatible gateway (maps/data proxies, notifications)",
  },
  {
    name: "SERPAPI_API_KEY",
    value: ENV.serpApiKey,
    critical: false,
    usedBy: "Search agent (Google Images via SerpAPI)",
  },
  {
    name: "GOOGLE_API_KEY",
    value: ENV.googleApiKey,
    critical: false,
    usedBy: "Gemini-based vision / generation (optional alternative to OpenAI)",
  },
  {
    name: "JWT_SECRET",
    value: ENV.cookieSecret,
    critical: false,
    usedBy: "Auth cookie signing",
  },
  {
    name: "CLOUDINARY_URL",
    value: ENV.cloudinaryUrl,
    critical: false,
    usedBy: "Image storage (Cloudinary)",
  },
];

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Validates all required environment variables at startup.
 *
 * - Missing CRITICAL keys → logs error and exits the process (cannot start safely)
 * - Missing WARNING keys  → logs a warning but continues startup
 *
 * Call this once, as early as possible in server/index.ts (after dotenv loads).
 */
export function validateEnv(): void {
  const missingCritical: string[] = [];
  const missingWarnings: string[] = [];

  for (const spec of KEY_SPECS) {
    if (!spec.value || spec.value.trim() === "") {
      if (spec.critical) {
        missingCritical.push(spec.name);
        console.error(
          `  ✗ [CRITICAL] ${spec.name} is not set\n` +
          `             Used by: ${spec.usedBy}`
        );
      } else {
        missingWarnings.push(spec.name);
        console.warn(
          `  ⚠ [WARNING]  ${spec.name} is not set\n` +
          `             Used by: ${spec.usedBy}`
        );
      }
    } else {
      // Mask secret — only show first 6 chars so logs stay safe
      const masked = spec.value.slice(0, 6) + "…";
      console.log(`  ✓ ${spec.name.padEnd(22)} ${masked}`);
    }
  }

  console.log(""); // visual spacer

  if (missingWarnings.length > 0) {
    console.warn(
      `⚠  ${missingWarnings.length} optional key(s) missing — some features will be unavailable.\n` +
      `   Copy .env.example → .env and fill in the missing values.\n`
    );
  }

  if (missingCritical.length > 0) {
    console.error(
      `✗  ${missingCritical.length} critical key(s) missing — server cannot start safely.\n` +
      `   Copy .env.example → .env and fill in the missing values.\n`
    );
    process.exit(1);
  }

  console.log("✔  Environment validated successfully.\n");
}
