import { AgentState } from "../state";
import { debugLog } from "../../_core/debug";
import { z } from "zod";
import { ENV } from "../../_core/env";
import { getGeminiClient } from "../../_core/gemini";

const RefineOutputSchema = z.object({
  improvedQuery: z.string(),
});

/**
 * Refine Agent — query optimization via Gemini ({@link ENV.geminiModelText}).
 */
export async function refineNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- REFINE AGENT ---");

  const currentQuery = state.searchQuery || state.description;
  debugLog("REFINE INPUT", currentQuery);

  if (!currentQuery) {
    console.warn("No baseline query available to refine. Iterating blindly.");
    return { iterations: 1 };
  }

  const feedbackText = state.feedback
    ? `\nAdditional Constraints/Feedback:\n"${state.feedback}"`
    : "";

  const systemPrompt = `You are a search query refinement expert optimizing visual search queries.
Your task is to take an initial search query (and an optional constraint/feedback string) and improve it for an image search engine.

Apply the following logic strictly:
1. Add deeper precision and distinguishing detail (e.g., exact color palettes, specific object names, fabrics, textures, lighting, or artistic style).
2. Completely remove and avoid generic wrapper terms (e.g., "picture of", "image showing", "photo").
3. Synthesize the context to make the final search phrase concise but highly descriptive and targeted.

Provide your response strictly in JSON format matching this exact schema:
{
  "improvedQuery": "The improved, precise search query string to be used."
}`;

  console.log(`Analyzing query to optimize: "${currentQuery}"...`);

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: ENV.geminiModelText,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const userBlock = `Original Query:\n"${currentQuery}"${feedbackText}`;
    const result = await model.generateContent(
      `${systemPrompt}\n\n${userBlock}`
    );

    const content = result.response.text();
    if (!content) {
      throw new Error("No response generated from the refinement model.");
    }

    const parsed = JSON.parse(content);
    const validated = RefineOutputSchema.parse(parsed);

    debugLog("REFINE OUTPUT", validated.improvedQuery);

    console.log(`New highly precise query formulated: "${validated.improvedQuery}"`);

    return {
      searchQuery: validated.improvedQuery,
      iterations: 1,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Refinement agent failed to execute:", msg);

    return { iterations: 1 };
  }
}
