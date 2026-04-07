import { AgentState } from "../state";
import { generateGeminiImageBytes } from "../../_core/gemini";
import { doImagesBatch, ImageVariant, ProductContext, GroundingData } from "../promptBuilder";
import { validateProductFidelity } from "../validator";
import { ENV } from "../../_core/env";

/**
 * Generation Agent — image variations via the 7-STEP STRICT Composition Engine.
 * 
 * 1. Generates 4 professional e-commerce variants.
 * 2. Mandatory Post-Validation Fidelity Check.
 * 3. Rejects any output that modifies a single pixel of the product.
 */
export async function generateNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- GENERATE AGENT (STRICT ENGINE) ---");

  if (!state.description || !state.imagePath) {
    console.warn("Missing description or imagePath for image generation. Skipping.");
    return { generatedImages: [] };
  }

  // 1. Prepare Grounding & Context
  const groundingData: GroundingData = {
    searchQuery: state.searchQuery,
    topResultTitles: state.results?.map(r => r.title).filter((t): t is string => !!t),
    visualMatches: state.results?.map(r => ({ title: r.title, snippet: r.snippet })),
  };

  const ctx: ProductContext = {
    description: state.description,
    productName: state.productName,
    category: state.category,
    keyFeatures: state.keyFeatures,
    dominantColor: state.dominantColor,
    environment: state.environment,
    groundingData,
  };

  // 2. Define EXACTLY 4 strict e-commerce variants
  const variants: ImageVariant[] = [
    "main",
    "lifestyle",
    "specification",
    "marketing",
  ];

  console.log(
    `Generating ${variants.length} premium variations concurrently via STRICT Engine…`
  );

  // 3. Batch Generation + Post-Validation Audit
  const geminiGenerator = async (prompt: string): Promise<string> => {
    console.log(`\n[GENERATOR] Using Model: ${ENV.geminiModelNanoBanana || "imagen-3.0-generate-002"}`);
    const { buffer, mimeType } = await generateGeminiImageBytes(prompt);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  };

  const initialResults = await doImagesBatch(variants, ctx, geminiGenerator);

  console.log(`Initial generation successful: ${initialResults.length}/${variants.length} images.`);

  // 4. STEP 7: FINAL VALIDATION (Audit)
  const auditTasks = initialResults.map(async (res) => {
    const audit = await validateProductFidelity(state.imagePath, res.url);
    if (!audit.success) {
      console.warn(`[REJECTED] ${res.type}: Fidelity score ${audit.score} (Violations: ${audit.violations.join(", ")})`);
      return null;
    }
    console.log(`[VERIFIED] ${res.type}: Fidelity score ${audit.score} — APPROVED.`);
    return res;
  });

  const verifiedResults = (await Promise.all(auditTasks))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  console.log(`\n======================================================`);
  console.log(`[GENERATE NODE SUMMARY]`);
  console.log(`- Total Variants Requested: ${variants.length}`);
  console.log(`- Initial Generations Succeeded: ${initialResults.length}`);
  console.log(`- Verified Generations Approved: ${verifiedResults.length}`);
  console.log(`======================================================\n`);

  return { 
    generatedImages: verifiedResults 
  };
}
