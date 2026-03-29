import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import axios from "axios";
import { ENV } from "../_core/env";

/**
 * Visual search result item
 */
export interface VisualMatch {
  position: number;
  title: string;
  link: string;
  source: string;
  thumbnail: string;
  image: string;
}

/**
 * State for the visual search agent
 */
export interface VisualSearchState {
  imageUrl: string;
  imageDescription?: string;
  searchQuery?: string;
  visualMatches?: VisualMatch[];
  refinementCount: number;
  error?: string;
}

/**
 * Analyze the uploaded image using Gemini to generate a description
 */
export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: ENV.geminiApiKey,
      model: ENV.geminiModelText,
    });

    // Prepare the image content using proper format
    const content = [
      {
        type: "text" as const,
        text: "Analyze this image and provide a detailed description suitable for visual search. Include objects, colors, style, composition, and any distinctive features. Keep it concise but informative (2-3 sentences).",
      },
      {
        type: "image_url" as const,
        image_url: {
          url: imageUrl,
        },
      },
    ];

    const message = new HumanMessage({
      content: content as any,
    });

    const response = await model.invoke([message]);
    const description = typeof response.content === "string" ? response.content : String(response.content);
    return description;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during image analysis";
    throw new Error(`Image analysis failed: ${errorMessage}`);
  }
}

/**
 * Perform visual search using SerpApi Google Lens API
 */
export async function performVisualSearch(
  imageUrl: string,
  searchQuery?: string
): Promise<VisualMatch[]> {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided for search");
    }

    const params: Record<string, string | number> = {
      engine: "google_lens",
      url: imageUrl,
      api_key: process.env.SERPAPI_API_KEY || "",
    };

    // Add search query if provided (for refinement)
    if (searchQuery) {
      params.q = searchQuery;
    }

    const response = await axios.get("https://serpapi.com/search", { params });

    const visualMatches = response.data.visual_matches || [];

    // Ensure all required fields are present
    return visualMatches
      .slice(0, 20)
      .map((match: Record<string, unknown>) => ({
        position: match.position || 0,
        title: match.title || "Untitled",
        link: match.link || "",
        source: match.source || "Unknown",
        thumbnail: match.thumbnail || "",
        image: match.image || "",
      }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during search";
    throw new Error(`Visual search failed: ${errorMessage}`);
  }
}

/**
 * Execute the complete visual search workflow
 */
export async function executeVisualSearch(
  imageUrl: string,
  searchQuery?: string
): Promise<VisualSearchState> {
  const state: VisualSearchState = {
    imageUrl,
    searchQuery,
    refinementCount: 0,
  };

  try {
    // Step 1: Analyze the image
    state.imageDescription = await analyzeImage(imageUrl);

    // Step 2: Perform visual search
    state.visualMatches = await performVisualSearch(imageUrl, searchQuery);

    // Step 3: If search query was provided, increment refinement count
    if (searchQuery) {
      state.refinementCount = 1;
    }

    return state;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Unknown error";
    return state;
  }
}

/**
 * Refine search results with a new query
 */
export async function refineSearch(
  state: VisualSearchState,
  newQuery: string
): Promise<VisualSearchState> {
  const refinedState: VisualSearchState = {
    ...state,
    searchQuery: newQuery,
    refinementCount: state.refinementCount + 1,
  };

  try {
    // Re-perform search with new query
    refinedState.visualMatches = await performVisualSearch(state.imageUrl, newQuery);
    return refinedState;
  } catch (error) {
    refinedState.error = error instanceof Error ? error.message : "Unknown error";
    return refinedState;
  }
}
