import axios from "axios";
import { AgentState } from "../state";
import { searchCache, LRUCache } from "../cache";
import { withTimeout, withRetry, TIMEOUTS } from "../pipeline";

/**
 * Search Agent Node
 * Pure function responsible for fetching image results based on the formulated search query.
 *
 * Optimisations:
 *  - LRU cache: identical queries skip SerpAPI entirely (30-min TTL)
 *  - Hard timeout: SerpAPI calls are capped at TIMEOUTS.search ms
 *  - Retry: up to 2 attempts with exponential back-off on transient failures
 */
export async function searchNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- SEARCH AGENT ---");

  const queryToSearch = state.searchQuery || state.description;

  if (!queryToSearch) {
    console.warn("No search query formulated. Skipping image search.");
    return { results: [] };
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SERPAPI_API_KEY in environment variables.");
  }

  // ── Cache check ────────────────────────────────────────────────────────────
  const cacheKey = LRUCache.hashKey(queryToSearch);
  const cached = searchCache.get(cacheKey);

  if (cached) {
    console.log(`[Cache HIT] Returning ${cached.length} cached results for: "${queryToSearch.slice(0, 60)}…"`);
    return { results: cached };
  }

  console.log(`[Cache MISS] Fetching SerpAPI results for: "${queryToSearch.slice(0, 60)}…"`);

  // ── Fetch with timeout + retry ─────────────────────────────────────────────
  try {
    const topResults = await withRetry(
      () =>
        withTimeout(
          axios
            .get("https://serpapi.com/search.json", {
              params: { engine: "google_images", q: queryToSearch, api_key: apiKey },
            })
            .then((res) => {
              const imagesResults: any[] = res.data.images_results || [];
              return imagesResults.slice(0, 10).map((img) => ({
                title:     img.title     || "Untitled Image",
                link:      img.link      || img.original || "",
                thumbnail: img.thumbnail || "",
              }));
            }),
          TIMEOUTS.search,
          "SerpAPI Google Images"
        ),
      2,    // max attempts
      500,  // base back-off ms
      "SerpAPI search"
    );

    // Store in cache for future duplicate queries
    searchCache.set(cacheKey, topResults);
    console.log(`[Cache SET] Stored ${topResults.length} results (key: ${cacheKey})`);

    return { results: topResults };

  } catch (error: any) {
    console.error("Search agent failed:", error.message);
    if (error.response?.data?.error) {
      console.error("SerpAPI error payload:", error.response.data.error);
    }
    throw new Error(`Search agent failed: ${error.message}`);
  }
}
