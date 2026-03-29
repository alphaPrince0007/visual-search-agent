/** Ensures OpenAI client modules can load in tests without a real API key. */
process.env.OPENAI_API_KEY ??= "sk-test-placeholder-not-for-production";
/** Gemini agents and LangChain Google GenAI */
process.env.GEMINI_API_KEY ??= "test-gemini-key-placeholder";
