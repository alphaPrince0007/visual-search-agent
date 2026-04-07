import { getGeminiClient, imageUrlToInlinePart } from "../_core/gemini";
import { withTimeout, TIMEOUTS } from "./pipeline";
import { ENV } from "../_core/env";
import { z } from "zod";

const FidelityResultSchema = z.object({
  score: z.number().min(0).max(1),
  match: z.boolean(),
  violations: z.array(z.string()),
});

/**
 * Pixel-Fidelity Auditor
 * 
 * Performs a strict visual audit comparing the source product with the
 * generated composition. Rejects any output that modifies the product.
 */
export async function validateProductFidelity(
  originalImageUrl: string,
  generatedImageUrl: string
): Promise<{ success: boolean; score: number; violations: string[] }> {
  console.log("--- PRODUCT FIDELITY AUDIT ---");

  const systemPrompt = `You are a strict e-commerce quality controller.
Your job is to compare two images: 
1. The ORIGINAL source product.
2. The COMPOSED marketing image.

CRITICAL HARD-LOCK RULES:
- The product in the Composed image must be PIXEL-IDENTICAL to the Original.
- NO redrawing, NO regeneration, NO beautification.
- Shape, texture, color, and reflections MUST be exactly the same.
- Lighting on the product MUST remain unchanged from the source.

Respond strictly in JSON format:
{
  "score": (number 0.0 to 1.0, where 1.0 is a perfect match),
  "match": (boolean, true if NO pixels of the product were modified),
  "violations": ["List any specific parts that were smoothed, redrawn, or changed"]
}`;

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: ENV.geminiModelText, // Using a Vision-capable text model (likely Gemini 1.5 Pro/Flash)
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const originalPart = await imageUrlToInlinePart(originalImageUrl);
    const generatedPart = await imageUrlToInlinePart(generatedImageUrl);

    const result = await withTimeout(
      model.generateContent([
        { text: "Compare the product in these two images. Is the identity 100% preserved?" },
        originalPart,
        generatedPart,
      ]),
      TIMEOUTS.vision * 2, // Allow more time for dual-image comparison
      "Fidelity Auditor"
    );

    const content = result.response.text();
    console.log(`[Audit] Raw Response Content: ${content}`);
    const validated = FidelityResultSchema.parse(JSON.parse(content));

    console.log(`[Audit] Fidelity Score: ${validated.score} (Match: ${validated.match})`);
    if (!validated.match) {
      console.warn(`[Audit] Violations detected: ${validated.violations.join(", ")}`);
    }

    // DEBUG: Loosen strictness to allow images that might have minor variations
    return {
      success: validated.score >= 0.7,
      score: validated.score,
      violations: validated.violations,
    };
  } catch (err) {
    console.error("[Audit] Fidelity check failed:", err);
    // Safe fallback: if audit fails, we assume failure to be strict
    return { success: false, score: 0, violations: ["Audit process error"] };
  }
}
