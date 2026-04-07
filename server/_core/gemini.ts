import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env";

export function assertGeminiConfigured(): void {
  if (!ENV.geminiApiKey?.trim()) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured");
  }
}

export function getGeminiClient(): GoogleGenerativeAI {
  assertGeminiConfigured();
  return new GoogleGenerativeAI(ENV.geminiApiKey);
}

/**
 * Convert an image URL, https URL, or data: URI to Gemini inlineData.
 */
export async function imageUrlToInlinePart(
  imageUrl: string
): Promise<{ inlineData: { mimeType: string; data: string } }> {
  if (imageUrl.startsWith("data:")) {
    const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(imageUrl);
    if (!m) throw new Error("Invalid data URL for image");
    return { inlineData: { mimeType: m[1], data: m[2] } };
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  return { inlineData: { mimeType, data: buf.toString("base64") } };
}

const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Native image generation via Gemini (response modalities include IMAGE).
 * Uses REST so newer `responseModalities` fields work even if the JS types lag.
 */
export async function generateGeminiImageBytes(prompt: string): Promise<{
  mimeType: string;
  buffer: Buffer;
}> {
  assertGeminiConfigured();
  const model = ENV.geminiModelNanoBanana;
  const endpoint = `${GEMINI_API_ROOT}/models/${model}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 0.4,
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error(`❌ [GEMINI] IMAGE GENERATION ERROR: ${res.status} - ${raw}`);
    throw new Error(`Gemini image generation failed: ${res.status} ${raw}`);
  }
  let data: {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
      };
    }>;
  };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new Error(`Gemini image: invalid JSON: ${raw.slice(0, 500)}`);
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType || "image/png",
        buffer: Buffer.from(part.inlineData.data, "base64"),
      };
    }
  }
  throw new Error("Gemini returned no image in the response");
}
