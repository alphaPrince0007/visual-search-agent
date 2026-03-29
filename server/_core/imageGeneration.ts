/**
 * Image generation via Gemini (GEMINI_MODEL_NANO_BANANA), stored with the app storage layer.
 */
import { storagePut } from "../storage";
import { assertGeminiConfigured, generateGeminiImageBytes } from "./gemini";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  assertGeminiConfigured();

  let prompt = options.prompt;
  if (options.originalImages?.length) {
    prompt += "\n\nUse the following reference images as style or content guidance where applicable.";
  }

  const { buffer, mimeType } = await generateGeminiImageBytes(prompt);
  const ext = mimeType.includes("png") ? "png" : "jpg";

  const { url } = await storagePut(
    `generated/${Date.now()}.${ext}`,
    buffer,
    mimeType
  );
  return { url };
}
