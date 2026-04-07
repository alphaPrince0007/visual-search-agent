import { Annotation } from "@langchain/langgraph";
import { GeneratedImageResult } from "./promptBuilder";

// Strongly-typed interface for results to ensure scalability
export interface SearchResult {
  id?: string;
  title?: string;
  url?: string;
  snippet?: string;
  score?: number;
  [key: string]: any; // Allows extensibility for future agents
}

// Strongly typed AgentState Interface
export interface AgentState {
  imagePath: string;
  description: string;
  searchQuery: string;
  results: SearchResult[];
  rankedResults: SearchResult[];
  generatedImages: GeneratedImageResult[]; // Rich product variations from the engine
  iterations: number;
  feedback?: string;

  // Intelligent context enhancement fields (populated by vision agent)
  productName?: string;
  category?: string;
  keyFeatures?: string[];
  dominantColor?: string;
  environment?: string;
}

// Map the Interface directly to LangGraph Annotation Channels
export const StateAnnotation = Annotation.Root({
  imagePath: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  description: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  searchQuery: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  results: Annotation<SearchResult[]>({
    reducer: (x: SearchResult[], y: SearchResult[]) => y ?? x,
    default: () => [],
  }),
  rankedResults: Annotation<SearchResult[]>({
    reducer: (x: SearchResult[], y: SearchResult[]) => y ?? x,
    default: () => [],
  }),
  iterations: Annotation<number>({
    reducer: (x: number, y: number) => x + (y ?? 0),
    default: () => 0,
  }),
  feedback: Annotation<string | undefined>({
    reducer: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  }),
  generatedImages: Annotation<GeneratedImageResult[]>({
    reducer: (x: GeneratedImageResult[], y: GeneratedImageResult[]) => y ?? x,
    default: () => [],
  }),
  productName: Annotation<string | undefined>({
    reducer: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  }),
  category: Annotation<string | undefined>({
    reducer: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  }),
  keyFeatures: Annotation<string[] | undefined>({
    reducer: (x: string[] | undefined, y: string[] | undefined) => y ?? x,
    default: () => undefined,
  }),
  dominantColor: Annotation<string | undefined>({
    reducer: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  }),
  environment: Annotation<string | undefined>({
    reducer: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  }),
});
