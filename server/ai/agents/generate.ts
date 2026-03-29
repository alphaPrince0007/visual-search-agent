import { AgentState } from "../state";
import { ENV } from "../../_core/env";
import { generateGeminiImageBytes } from "../../_core/gemini";

/**
 * Generation Agent — image variations via Gemini ({@link ENV.geminiModelNanoBanana}).
 */
export async function generateNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- GENERATE AGENT ---");

  const description = state.description;
  if (!description) {
    console.warn("No description available for image generation. Skipping.");
    return { generatedImages: [] };
  }

  const generationPrompt = `Create a high-quality image variation based on the following visual description:
"${description}"

Style: photorealistic, high detail, professional product photography.`;

  console.log(
    `Generating 3 image variations concurrently via Gemini (${ENV.geminiModelNanoBanana})…`
  );

  const generationRequests = Array.from({ length: 3 }, (_, i) =>
    generateGeminiImageBytes(generationPrompt)
      .then(({ buffer, mimeType }) => {
        const b64 = buffer.toString("base64");
        return `data:${mimeType};base64,${b64}`;
      })
      .catch((err: Error) => {
        console.warn(`Generation request ${i + 1} failed: ${err.message}`);
        return null;
      })
  );

  const settled = await Promise.all(generationRequests);

  const generatedImages = settled.filter((url): url is string => typeof url === "string");

  console.log(`Generated ${generatedImages.length}/3 image variation(s) successfully.`);

  return { generatedImages };
}
