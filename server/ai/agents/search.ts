import { ENV } from "../../_core/env";
import { debugLog } from "../../_core/debug";
import axios from "axios";
import { AgentState } from "../state";
import { searchCache, LRUCache } from "../cache";
import { withTimeout, withRetry, TIMEOUTS } from "../pipeline";

/**
 * Search Agent Node
 * Pure function responsible for fetching image results based on the formulated search query.
 */
export async function searchNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("--- SEARCH AGENT ---");

  const queryToSearch = state.searchQuery || state.description;
  debugLog("SEARCH QUERY", queryToSearch);

  if (!queryToSearch) {
    console.warn("No search query formulated. Skipping image search.");
    return { results: [] };
  }

  // ── Environment Check ────────────────────────────────────────────────────────
  const apiKey = ENV.serpApiKey;
  debugLog("SERP API KEY", apiKey);

  if (!apiKey || apiKey === "your_serpapi_key_here") {
    console.error("Agent error: Missing or invalid SERPAPI_API_KEY. Please set a valid key in .env.");
    return { results: [] }; // Safe fallback
  }

  // ── Cache check ────────────────────────────────────────────────────────────
  const cacheKey = LRUCache.hashKey(queryToSearch);
  const cached = searchCache.get(cacheKey);

  if (cached) {
    console.log(`[Cache HIT] Returning ${cached.length} cached results for: "${queryToSearch.slice(0, 60)}…"`);
    return { results: cached };
  }

  console.log(`[Cache MISS] Fetching SerpAPI results for: "${queryToSearch.slice(0, 60)}…"`);

  // ── Debug Logging ───────────────────────────────────────────────────────────
  console.log("SERP KEY:", process.env.SERP_API_KEY);
  console.log("QUERY:", queryToSearch);

  debugLog("SERP REQUEST PARAMS", {
    engine: "google_images",
    q: queryToSearch,
    api_key: process.env.SERP_API_KEY
  });

  // ── Fetch with timeout + retry ─────────────────────────────────────────────
  try {
    const topResults = await withRetry(
      () =>
        withTimeout(
          axios
            .get("https://serpapi.com/search.json", {
              params: { engine: "google_images", q: queryToSearch, api_key: process.env.SERP_API_KEY },
            })
            .then((res) => {
              debugLog("SERP RESPONSE", res.data);
              const imagesResults: any[] = res.data.images_results || [];
              return imagesResults.slice(0, 10).map((img: any) => ({
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
    debugLog("SERP ERROR", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Production-ready safe return: don't crash the pipeline, just return empty results
    return { results: [] };
  }
}
