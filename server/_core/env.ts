export const ENV = {
  // ── App core ────────────────────────────────────────────────────────────────
  appId:          process.env.VITE_APP_ID        ?? "",
  cookieSecret:   process.env.JWT_SECRET         ?? "",
  oAuthServerUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  ownerOpenId:    process.env.OWNER_OPEN_ID      ?? "",
  cloudinaryUrl:  process.env.CLOUDINARY_URL     ?? "",
  isProduction:   process.env.NODE_ENV === "production",

  // ── Database ─────────────────────────────────────────────────────────────────
  databaseUrl:    process.env.DATABASE_URL       ?? "",

  // ── AI / external services ───────────────────────────────────────────────────
  openAiKey:      process.env.OPENAI_API_KEY     ?? "",
  googleApiKey:   process.env.GOOGLE_API_KEY     ?? "",
  serpApiKey:     process.env.SERPAPI_API_KEY    ?? "",

  /** Google AI Studio / Gemini API key (falls back to GOOGLE_API_KEY). */
  geminiApiKey:   process.env.GEMINI_API_KEY     ?? process.env.GOOGLE_API_KEY ?? "",
  /** Text + vision JSON tasks (vision agent, refine agent, invokeLLM, visual search analysis). */
  geminiModelText:
    process.env.GEMINI_MODEL_TEXT ?? "gemini-2.5-flash-lite",
  /** Image generation (generate agent, imageGeneration helper). */
  geminiModelNanoBanana:
    process.env.GEMINI_MODEL_NANO_BANANA ?? "gemini-3-pro-image-preview",

  /** OpenAI-compatible API base URL (no trailing path). Used for chat completions, maps proxy, etc. */
  forgeApiUrl:
    process.env.LLM_API_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "",
  /** Bearer token for the LLM gateway (defaults to OPENAI_API_KEY when unset). */
  forgeApiKey:
    process.env.LLM_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "",
};

