import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { AgentState } from "../state";
import { visionCache, LRUCache } from "../cache";
import { withTimeout, TIMEOUTS } from "../pipeline";
import { ENV } from "../../_core/env";
import { getGeminiClient, imageUrlToInlinePart } from "../../_core/gemini";

const VisionOutputSchema = z.object({
  description: z.string(),
  searchQuery: z.string(),
});

/**
 * Vision Agent — multimodal JSON output via Gemini ({@link ENV.geminiModelText}).
 */
export async function visionNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- VISION AGENT ---");

  if (!state.imagePath) {
    console.warn("No imagePath provided to Vision Agent. Skipping.");
    return {};
  }

  if (state.description && state.searchQuery) {
    console.log("[Vision] Description already populated — skipping inference.");
    return {};
  }

  const cacheKey = LRUCache.hashKey(state.imagePath);
  const cached = visionCache.get(cacheKey);

  if (cached) {
    console.log("[Cache HIT] Returning cached vision result.");
    return cached;
  }

  let imageUrl: string;

  if (
    state.imagePath.startsWith("http://") ||
    state.imagePath.startsWith("https://") ||
    state.imagePath.startsWith("data:")
  ) {
    imageUrl = state.imagePath;
  } else {
    const imageBytes = await fs.readFile(state.imagePath);
    const base64Str = imageBytes.toString("base64");
    const ext = path.extname(state.imagePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const mimeType = mimeMap[ext] ?? "image/jpeg";
    imageUrl = `data:${mimeType};base64,${base64Str}`;
  }

  const systemPrompt = `You are an expert visual intelligence assistant.
Analyze the provided image and respond strictly in JSON format matching the following schema:
{
  "description": "A highly detailed description of the image, capturing key subjects, styling, colors, context, brands, and any text present. Make it exhaustive and hyper-useful for deep semantic search.",
  "searchQuery": "An optimized, concise search query derived strictly from the visual attributes and image description, perfect for passing into an image or product search engine."
}`;

  console.log(`[Vision] Calling Gemini (${ENV.geminiModelText})…`);

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: ENV.geminiModelText,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
        maxOutputTokens: 8192,
      },
    });

    const imagePart = await imageUrlToInlinePart(imageUrl);

    const result = await withTimeout(
      model.generateContent([
        {
          text: "Analyze this image and output the requested JSON only, no markdown or code fences.",
        },
        imagePart,
      ]),
      TIMEOUTS.vision,
      "Gemini Vision"
    );

    const content = result.response.text();
    if (!content) throw new Error("No response generated from the vision model.");

    const validated = VisionOutputSchema.parse(JSON.parse(content));

    visionCache.set(cacheKey, validated);
    console.log(`[Cache SET] Vision result cached (key: ${cacheKey})`);

    return {
      description: validated.description,
      searchQuery: validated.searchQuery,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Vision] API call failed:", msg);
    throw err;
  }
}
