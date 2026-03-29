import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import { createSearch, updateSearch, getUserSearches, getSearchById, createSearchHistory, getSearchHistory, createResults, getResultsForSearch } from "../db";
import { agentGraph } from "../ai/graph";
import { nanoid } from "nanoid";

/**
 * Visual Search Router
 * Handles image upload, search initiation, refinement, and history retrieval mapped to relational schemas.
 */
export const visualSearchRouter = router({
  initiateSearch: protectedProcedure
    .input(z.object({
      imageBase64: z.string().describe("Base64 encoded image data"),
      mimeType: z.string().describe("MIME type of the image (e.g., image/jpeg)"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const fileName = `visual-search/${ctx.user.id}/${nanoid()}.${input.mimeType.split("/")[1]}`;
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const { url: imageUrl } = await storagePut(fileName, imageBuffer, input.mimeType);

        console.log(`Starting autonomous visual mapping graph for: ${imageUrl}`);
        const finalState = await agentGraph.invoke({ imagePath: imageUrl });

        const search = await createSearch({
          userId: ctx.user.id,
          imagePath: imageUrl,
          query: finalState.description || "Parsed image",
        });

        if (!search) throw new Error("Database failed to commit search row.");

        if (Array.isArray(finalState.rankedResults)) {
            const parsedResults = finalState.rankedResults
              .slice(0, 50)
              .map((r: any) => ({
                searchId: search.id,
                imageUrl: r.thumbnail || r.link || "",
                score: r.score || 0
            }));
            if (parsedResults.length > 0) {
                await createResults(parsedResults);
            }
        }

        const storedResults = await getResultsForSearch(search.id);

        return {
          success: true,
          searchId: search.id,
          imageUrl: search.imagePath,
          imageDescription: search.query,
          visualMatches: storedResults,
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }),

  refineSearch: protectedProcedure
    .input(z.object({
      searchId: z.number().describe("ID of the search to refine"),
      refinementQuery: z.string().describe("Text query to refine results"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const originalSearch = await getSearchById(input.searchId);
        if (!originalSearch || originalSearch.userId !== ctx.user.id) {
          return { success: false, error: "Search not found or unauthorized" };
        }

        const historyCount = (await getSearchHistory(input.searchId)).length;

        // Iterate LangGraph with iterative feedback
        const finalState = await agentGraph.invoke({ 
            imagePath: originalSearch.imagePath,
            description: originalSearch.query || "",
            searchQuery: input.refinementQuery,
            feedback: input.refinementQuery,
            iterations: historyCount
        });

        await createSearchHistory({
          searchId: input.searchId,
          refinementQuery: input.refinementQuery,
          refinementNumber: historyCount + 1,
        });

        if (Array.isArray(finalState.rankedResults)) {
            // Push new refined results natively
            const parsedResults = finalState.rankedResults
              .slice(0, 50)
              .map((r: any) => ({
                searchId: originalSearch.id,
                imageUrl: r.thumbnail || r.link || "",
                score: r.score || 0
            }));
            if (parsedResults.length > 0) {
                await createResults(parsedResults);
            }
        }

        const updatedResults = await getResultsForSearch(originalSearch.id);

        return {
          success: true,
          visualMatches: updatedResults,
          refinementCount: historyCount + 1,
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failure" };
      }
    }),

  getSearchHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userSearches = await getUserSearches(ctx.user.id);
      return {
        success: true,
        searches: userSearches.map((search) => ({
          id: search.id,
          imageUrl: search.imagePath,
          searchQuery: search.query,
          refinementCount: 0, // Migrated out to history tracking natively
          createdAt: search.createdAt,
        })),
      };
    } catch (error) {
      return { success: false, error: "Failed to get history", searches: [] };
    }
  }),

  getSearchDetails: protectedProcedure
    .input(z.object({ searchId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const search = await getSearchById(input.searchId);
        if (!search || search.userId !== ctx.user.id) return { success: false, error: "Unauthorized" };

        const history = await getSearchHistory(input.searchId);
        const storedResults = await getResultsForSearch(input.searchId);

        return {
          success: true,
          search: {
            id: search.id,
            imageUrl: search.imagePath,
            imageDescription: search.query,
            visualMatches: storedResults,
            createdAt: search.createdAt,
          },
          refinementHistory: history.map((h) => ({
            id: h.id,
            refinementNumber: h.refinementNumber,
            refinementQuery: h.refinementQuery,
            createdAt: h.createdAt,
          })),
        };
      } catch (error) {
        return { success: false, error: "Failed to get search details" };
      }
    }),

  getRefinementResults: protectedProcedure
    .input(z.object({ searchId: z.number(), refinementNumber: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const search = await getSearchById(input.searchId);
        if (!search || search.userId !== ctx.user.id) return { success: false, error: "Unauthorized" };

        const history = await getSearchHistory(input.searchId);
        const refinement = history.find((h) => h.refinementNumber === input.refinementNumber);
        if (!refinement) return { success: false, error: "Refinement not found" };

        return {
          success: true,
          refinement: {
            refinementNumber: refinement.refinementNumber,
            refinementQuery: refinement.refinementQuery,
            visualMatches: await getResultsForSearch(search.id), // Fallback array map since visualMatches natively removed
            createdAt: refinement.createdAt,
          },
        };
      } catch (error) {
        return { success: false, error: "Failed to get refinement results" };
      }
    }),
});
