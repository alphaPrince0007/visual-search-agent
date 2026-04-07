import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { AgentState } from "../state";
import { visionCache, LRUCache } from "../cache";
import { withTimeout, TIMEOUTS } from "../pipeline";
import { ENV } from "../../_core/env";
import { getGeminiClient, imageUrlToInlinePart } from "../../_core/gemini";
import { debugLog } from "../../_core/debug";

const VisionOutputSchema = z.object({
  description: z.string(),
  searchQuery: z.string(),
  productName: z.string().optional(),
  category: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  dominantColor: z.string().optional(),
  environment: z.string().optional(),
});

const STRICT_IDENTIFICATION_GUARDRAILS = `
=====================================================
STEP 1 — PRODUCT IDENTIFICATION (NO MODIFICATION)
=====================================================

You are a STRICT image composition engine operating in a controlled production environment.
Your ONLY task in this node is to extract the 100% visual truth of the product.

ABSOLUTE RULES:
- Identify the product name and category.
- Return internally what is visually present.
- DO NOT modify the image.
- DO NOT recreate anything.
- DO NOT enhance or speculate on missing details.
- DO NOT ignore visible imperfections; describe the product exactly as it is.
`.trim();

/**
 * Vision Agent — multimodal JSON output via Gemini ({@link ENV.geminiModelText}).
 */
export async function visionNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- VISION AGENT (STRICT IDENTIFICATION) ---");
  debugLog("VISION INPUT", state.imagePath);

  if (!state.imagePath) {
    console.warn("No imagePath provided to Vision Agent. Skipping.");
    return {};
  }

  if (state.description && state.searchQuery && state.productName) {
    console.log("[Vision] State already populated — skipping inference.");
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

  const systemPrompt = `You are a STRICT image composition engine.
${STRICT_IDENTIFICATION_GUARDRAILS}

Analyze the provided image and respond strictly in JSON format matching the following schema:
{
  "description": "The EXACT 'Visual Truth' of the product. Factual, zero-embellishment description of shape, texture, color, and state.",
  "searchQuery": "An optimized, concise search query for the REAL product.",
  "productName": "The factual name of the product.",
  "category": "The specific product category.",
  "keyFeatures": ["Up to 5 factual visual features strictly from the image."],
  "dominantColor": "True color of the product.",
  "environment": "Factual location of the product."
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

    const parsed = JSON.parse(content);
    const validated = VisionOutputSchema.parse(parsed);

    visionCache.set(cacheKey, validated);
    console.log(`[Cache SET] Vision result cached (key: ${cacheKey})`);

    debugLog("VISION OUTPUT", validated);

    return {
      description: validated.description,
      searchQuery: validated.searchQuery,
      productName: validated.productName,
      category: validated.category,
      keyFeatures: validated.keyFeatures,
      dominantColor: validated.dominantColor,
      environment: validated.environment,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Vision] API call failed:", msg);
    throw err;
  }
}
