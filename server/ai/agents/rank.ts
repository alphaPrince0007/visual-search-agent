import { env, pipeline, RawImage } from "@xenova/transformers";
import { AgentState, SearchResult } from "../state";
import { debugLog } from "../../_core/debug";

// Prevent local downloading errors if node environment disables local cache
env.allowLocalModels = false;

// Store a lazy-loaded instance of the pipeline
// We use 'image-feature-extraction' task using the CLIP Vision Transformer
let extractorPromise: Promise<any> | null = null;

// Helper to reliably compute cosine similarity between two feature vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Rank Agent Node
 * Pure function responsible for filtering and prioritizing retrieved search results 
 * visually against the input image using a local CLIP model (Xenova).
 * 
 * @param state Current graph state
 * @returns Partial updates to the state adding rankedResults
 */
export async function rankNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- RANK AGENT ---");
  
  if (!state.imagePath || !state.results || state.results.length === 0) {
    console.warn("Missing image setup or empty search results. Bypassing ranking.");
    return { rankedResults: state.results || [] };
  }

  try {
    // Lazy load the CLIP model if it hasn't mapped yet
    if (!extractorPromise) {
      console.log("Loading Xenova CLIP pipeline...");
      extractorPromise = pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
        // Specify standard revision
        revision: "main"
      });
    }
    
    const extractor = await extractorPromise;

    console.log("Extracting features for original user image...");
    const inputFeatures = await extractor(state.imagePath);
    const inputVector = Array.from(inputFeatures.data) as number[];

    console.log(`Scoring ${state.results.length} result images...`);
    
    // Process everything concurrently
    const scoredPromises = state.results.map(async (result: SearchResult) => {
      // Prioritize the thumbnail to avoid downloading massive original high-res imgs.
      const targetImageUrl = result.thumbnail || result.link;
      
      let score = 0;
      if (targetImageUrl) {
        try {
          const resultFeatures = await extractor(targetImageUrl);
          const resultVector = Array.from(resultFeatures.data) as number[];
          
          score = cosineSimilarity(inputVector, resultVector);
        } catch (imgErr) {
          console.warn(`Failed extracting features for image: ${targetImageUrl}`);
          score = -1; // penalize failures so they drop to bottom
        }
      }
      
      return {
        ...result,
        score
      };
    });

    const scoredResults = await Promise.all(scoredPromises);
    debugLog("RAW RESULTS", state.results);

    // Descending sort based on cosine similarity score
    scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    debugLog("RANKED RESULTS", scoredResults);

    // Log the top match out to verify distribution
    console.log(`Top match score: ${scoredResults[0]?.score}`);

    return {
      rankedResults: scoredResults
    };

  } catch (err: any) {
    console.error("Ranking agent crashed during model execution:", err.message);
    
    // In event of panic fail open, don't drop the context array entirely
    return { 
      rankedResults: state.results 
    };
  }
}
