import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation, AgentState } from "./state";
import { visionNode }   from "./agents/vision";
import { searchNode }   from "./agents/search";
import { rankNode }     from "./agents/rank";
import { refineNode }   from "./agents/refine";
import { generateNode } from "./agents/generate";
import { MAX_ITERATIONS } from "./pipeline";

/**
 * Conditional router.
 *
 * Uses MAX_ITERATIONS from pipeline.ts as the single source of truth — change
 * it there to affect the whole system (also updates rate-limit budgeting).
 *
 * Flow:
 *   rank → iterations < MAX_ITERATIONS → refine → search (loop)
 *   rank → iterations ≥ MAX_ITERATIONS → generate → END
 */
function shouldRefineOrGenerate(state: AgentState): "refine" | "generate" {
  console.log(`--- DECISION GATE [Iterations: ${state.iterations}/${MAX_ITERATIONS}] ---`);

  if (state.iterations < MAX_ITERATIONS) {
    console.log("Decision: Under cap → refine");
    return "refine";
  }

  console.log("Decision: Cap reached → generate");
  return "generate";
}

/**
 * Main LangGraph agent workflow.
 *
 *   START → vision → search → rank ──┬─(iter < MAX)──→ refine → search (loop)
 *                                    └─(iter ≥ MAX)──→ generate → END
 */
const workflow = new StateGraph(StateAnnotation)
  .addNode("vision",   visionNode)
  .addNode("search",   searchNode)
  .addNode("rank",     rankNode)
  .addNode("refine",   refineNode)
  .addNode("generate", generateNode)

  .addEdge(START, "vision")
  .addEdge("vision", "search")
  .addEdge("search", "rank")

  .addConditionalEdges("rank", shouldRefineOrGenerate, {
    refine:   "refine",
    generate: "generate",
  })

  .addEdge("refine",   "search")
  .addEdge("generate", END);

export const agentGraph = workflow.compile();
