import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeImage, performVisualSearch, executeVisualSearch, refineSearch } from "./visualSearchAgent";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock ChatGoogleGenerativeAI
vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: "This is a test image of a red apple on a wooden table",
    }),
  })),
}));

describe("Visual Search Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeImage", () => {
    it("should analyze an image and return a description", async () => {
      const imageUrl = "https://example.com/image.jpg";
      const description = await analyzeImage(imageUrl);

      expect(description).toBeDefined();
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });

    it("should handle base64 encoded images", async () => {
      const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      const description = await analyzeImage(base64Image);

      expect(description).toBeDefined();
      expect(typeof description).toBe("string");
    });

    it("should throw an error if API key is missing", async () => {
      const originalEnv = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        await analyzeImage("https://example.com/image.jpg");
      } catch (error) {
        expect(error).toBeDefined();
      }

      process.env.GEMINI_API_KEY = originalEnv;
    });
  });

  describe("performVisualSearch", () => {
    it("should return visual matches from SerpApi", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [
            {
              position: 1,
              title: "Test Image 1",
              link: "https://example.com/1",
              source: "Example",
              thumbnail: "https://example.com/thumb1.jpg",
              image: "https://example.com/img1.jpg",
            },
            {
              position: 2,
              title: "Test Image 2",
              link: "https://example.com/2",
              source: "Example",
              thumbnail: "https://example.com/thumb2.jpg",
              image: "https://example.com/img2.jpg",
            },
          ],
        },
      });

      const matches = await performVisualSearch("https://example.com/image.jpg");

      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveProperty("title");
      expect(matches[0]).toHaveProperty("link");
      expect(matches[0]).toHaveProperty("source");
    });

    it("should handle empty results", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [],
        },
      });

      const matches = await performVisualSearch("https://example.com/image.jpg");

      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBe(0);
    });

    it("should throw an error if no image URL is provided", async () => {
      try {
        await performVisualSearch("");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("No image URL");
      }
    });

    it("should include search query in request if provided", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [],
        },
      });

      await performVisualSearch("https://example.com/image.jpg", "red color");

      expect(axios.default.get).toHaveBeenCalledWith(
        "https://serpapi.com/search",
        expect.objectContaining({
          params: expect.objectContaining({
            q: "red color",
          }),
        })
      );
    });
  });

  describe("executeVisualSearch", () => {
    it("should execute complete visual search workflow", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [
            {
              position: 1,
              title: "Test Image",
              link: "https://example.com/1",
              source: "Example",
              thumbnail: "https://example.com/thumb.jpg",
              image: "https://example.com/img.jpg",
            },
          ],
        },
      });

      const result = await executeVisualSearch("https://example.com/image.jpg");

      expect(result).toBeDefined();
      expect(result.imageUrl).toBe("https://example.com/image.jpg");
      expect(result.imageDescription).toBeDefined();
      expect(result.visualMatches).toBeDefined();
      expect(Array.isArray(result.visualMatches)).toBe(true);
      expect(result.refinementCount).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it("should handle search errors gracefully", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockRejectedValueOnce(new Error("API Error"));

      const result = await executeVisualSearch("https://example.com/image.jpg");

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Visual search failed");
    });
  });

  describe("refineSearch", () => {
    it("should refine search with new query", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [
            {
              position: 1,
              title: "Refined Result",
              link: "https://example.com/refined",
              source: "Example",
              thumbnail: "https://example.com/thumb.jpg",
              image: "https://example.com/img.jpg",
            },
          ],
        },
      });

      const initialState = {
        imageUrl: "https://example.com/image.jpg",
        imageDescription: "A red apple",
        refinementCount: 0,
      };

      const result = await refineSearch(initialState, "bright red");

      expect(result).toBeDefined();
      expect(result.refinementCount).toBe(1);
      expect(result.searchQuery).toBe("bright red");
      expect(result.visualMatches).toBeDefined();
    });

    it("should increment refinement count", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValueOnce({
        data: {
          visual_matches: [],
        },
      });

      const initialState = {
        imageUrl: "https://example.com/image.jpg",
        refinementCount: 2,
      };

      const result = await refineSearch(initialState, "new query");

      expect(result.refinementCount).toBe(3);
    });
  });
});
