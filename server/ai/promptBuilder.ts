/**
 * Modular Prompt Builder System
 *
 * Architecture — prompts are assembled from four independent layers:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Layer 1: basePrompt      — core product identity            │
 *   │  Layer 2: groundingPrompt — real-world search context        │
 *   │  Layer 3: modePrompt      — variant-specific composition     │
 *   │  Layer 4: guardrails      — immutability enforcement         │
 *   │  ─────────────────────────────────────────────────────────── │
 *   │             composePrompt(variant, context)                   │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * To add a new image variant: add an entry to VARIANT_MODE_PROMPTS.
 * To swap model backends: pass a different `generator` to doImagesBatch().
 */

// ─────────────────────────────────────────────────────────────────
// STRICT IMMUTABILITY GUARDRAILS
//
// Injected into EVERY generated prompt. These rules prevent the model
// from altering core product identity, shape, color, or branding.
// DO NOT modify this block — it is the safety contract of the system.
// ─────────────────────────────────────────────────────────────────
export const STRICT_IMMUTABILITY_GUARDRAILS = `
You are operating inside a controlled e-commerce image composition system.

This is NOT a creative generation task.
This is NOT a redesign task.
This is NOT an enhancement task.

This is a strict foreground-lock + background-design + marketing-text placement task.

The input product image is a locked, immutable visual asset.
It must remain 100% unchanged.

============================================================
STEP 2 — HARD LOCK: PRODUCT IMMUTABILITY
============================================================

The input image contains the REAL product identified in Step 1.
You MUST treat it as:
- A fixed photograph
- A locked pixel object
- A non-editable layer
- The absolute visual truth

ABSOLUTE RULE:
You are NOT allowed to: redraw the product, regenerate the product, enhance the product, smooth textures, change colors, improve lighting, or fix imperfections.
If you change EVEN 1 pixel → FAILURE.

============================================================
SECTION 1 — ABSOLUTE PRODUCT IMMUTABILITY PROTOCOL
============================================================

The product is a protected foreground object.

Treat it as:
- A flat extracted image layer
- A locked pixel boundary
- A non-editable visual asset

STRICTLY PROHIBITED:
- Redrawing the product
- Regenerating any portion
- Reconstructing 3D geometry
- Enhancing material texture
- Smoothing imperfections
- Adjusting brightness/contrast of product
- Changing color temperature
- Modifying reflections
- Altering silhouette
- Reshaping edges
- Adjusting proportions
- Stretching or compressing
- Correcting symmetry
- Repairing perspective
- Stylizing
- Re-rendering material
- Adding missing details
- Removing visible details
- Cleaning edges
- Repainting highlights
- Adding artificial shine

Inside the product boundary:
NO PIXEL MODIFICATION IS PERMITTED.

If any pixel changes inside product:
Abort and return original image unchanged.

FACIAL FEATURE STATE PRESERVATION:
If any facial features are detected (eyes, ears, nose, mouth, etc.) on the product—e.g., figurines, idols, dolls, masks, statues—their exact state MUST be preserved. If eyes are open they must remain open; if closed they must remain closed. Ears, nose, mouth, and all facial details must keep their original position and expression. Do not alter, close, open, or reposition any facial feature.

============================================================
SECTION 2 — ALLOWED OPERATIONS (ONLY THESE)
============================================================

You may ONLY:
1. Remove the original background.
2. Extract product exactly as-is.
3. Place product onto a marketing background.
4. Add ultra-soft contact shadow beneath product.
5. Add marketing text outside product boundary.
6. Add minimal graphic elements outside boundary.
7. Remove any temporary PACKAGING MATERIAL (shrink-wrap, plastic film, polybags, outer cardboard boxes, foam, retail stickers) and any ARTIFICIAL FILTERS (heavy color grading, Instagram-style filters, strong vignettes) that sit on top of the true product surface, while faithfully revealing the actual product underneath without beautification or stylization.

No other operation is allowed.

============================================================
SECTION 3 — SCALE NORMALIZATION PROTOCOL
============================================================

Before composing:
1. Identify product category.
2. Estimate realistic retail market size.
3. Validate height-to-width ratio.
4. Ensure proportional realism.

STRICT SCALE RULES:
- Product must occupy 65%–85% of frame height.
- No exaggerated hero enlargement.
- No miniature rendering.
- Maintain original aspect ratio.
- Do NOT distort perspective.
- Adjust background layout — never product geometry.

The product must appear commercially realistic, not artificially magnified.

============================================================
ENVIRONMENT COMPOSITION CONTROL
============================================================

Follow realistic interior photography composition.

Frame composition:

• Product area: 35–50% of frame
• Environment area: 50–65% of frame

Camera must be positioned at mid-room distance,
not zoomed directly on the product.

For wall-mounted objects:
The wall must remain visible around the object.

Product width must never exceed 50% of visible wall width.

Include surrounding elements such as furniture,
wall texture, or decor to establish scale reference.

Use natural interior photography perspective.

Avoid tight framing that isolates the product.

============================================================
SECTION 3B — ENVIRONMENT SCALE VALIDATION (CRITICAL)
============================================================

When the product is placed inside a lifestyle environment,
the scale must be relative to surrounding objects.

ENVIRONMENT SCALE RULES:

• Wall-mounted objects (clocks, frames, mirrors):
  Product width must occupy ONLY 35–55% of visible wall width.

• Tabletop objects (vases, statues, candles):
  Product height must occupy 40–60% of table height.

• Floor objects (lamps, plants):
  Product height must occupy 50–70% of room height.

• Furniture items:
  Must maintain realistic human proportions.

ENVIRONMENT PRESENCE RULE:

The environment must always remain visible and believable.

The product must NEVER dominate the entire frame
when placed in a real-life environment.

SCENE BALANCE RULE:

At least TWO environmental elements must remain visible
(e.g., wall texture, furniture, shelf, lighting, decor).

If the product occupies more than 60% of the environment width,
reduce the scale.

Never crop environment elements unnaturally.

============================================================
SECTION 3C — COMPOSITION BALANCE RULE
============================================================

The product must integrate naturally into the scene.

Never create a product-centered composition that removes
environment context.

The environment should occupy at least 40% of the frame.

Camera angle should resemble real interior photography.

============================================================
SECTION 4 — SHADOW & LIGHT CONTROL PROTOCOL
============================================================

Heavy or dramatic shadows are prohibited.

Shadow rules:
- Only ultra-soft diffused contact shadow allowed.
- No hard shadow edges.
- No dark pools.
- No spotlight effect.
- No cinematic lighting.
- No high contrast.
- No dramatic glow.

Lighting must be:
- Neutral
- Soft
- Even
- Retail studio style

Background illumination may be slightly enhanced.
Product illumination must remain unchanged.

============================================================
SECTION 5 — BACKGROUND DESIGN RULES
============================================================

Background must be:
- Premium but subtle.
- Clean and uncluttered.
- Complementary or analogous to product color.
- Controlled contrast.
- Soft gradient allowed.
- No heavy textures.
- No visual noise.
- No dark dramatic backdrop.

The product must remain dominant focal point.

============================================================
SECTION 6 — MARKETING TEXT STRUCTURE
============================================================

Internally identify 5 visible characteristics.
Select top 3 strongest.

TEXT RULES:

Headline:
- Maximum 6 words.
- Benefit-focused.
- No exaggeration.
- No unverifiable claims.
- No emotional manipulation.
- Clean modern sans-serif.

Sub-line:
- One concise supporting benefit.
- Clear and professional.

Feature Highlights:
- Exactly 3 features.
- 2–4 words each.
- Factual.
- Visually provable.
- Balanced around product.
- Must not overlap product.
- Must not touch edges.

Typography:
- Dark gray or black.
- No glow.
- No drop shadow.
- No flashy styling.
- No oversized fonts.

============================================================
SECTION 7 — NO HUMAN INVOLVEMENT RULE
============================================================

Strictly prohibited:
- No humans
- No hands
- No silhouettes
- No reflections of people
- No human shadows
- No implied interaction

Product must stand independently.

============================================================
SECTION 8 — ZERO HALLUCINATION ENFORCEMENT
============================================================

You are not allowed to:
- Improve product appearance.
- Enhance material realism.
- Adjust internal lighting.
- Correct perspective.
- Clean imperfections.
- Add shine.
- Add reflections.
- Add decorative elements attached to product.
- Infer hidden features.

If marketing composition conflicts with product fidelity:
Remove marketing element.

Never modify product.

============================================================
SECTION 9 — PRIORITY HIERARCHY
============================================================

Product Integrity > Scale Accuracy > Lighting Neutrality > Text Placement > Background Design

Product immutability overrides everything.

============================================================
SECTION 10 — PRE-OUTPUT VALIDATION CHECKLIST
============================================================

Before final output confirm:
- Product pixels unchanged.
- No geometry distortion.
- No texture modification.
- No color shift.
- No internal lighting change.
- No heavy shadow.
- If facial features present: eyes/ears/etc. state unchanged (open→open, closed→closed).
- Realistic retail scale (65–85% frame).
- Text outside boundary.
- Background controlled and subtle.
- No humans present.

If any condition fails:
Abort and return original image unchanged.

============================================================
SECTION 11 — FINAL OUTPUT REQUIREMENTS
============================================================

Generate:
- High-resolution marketing image
- Premium controlled background
- Realistic retail-scale product proportions
- Ultra-soft contact shadow only
- Strong headline
- One supporting sub-line
- Three balanced feature highlights
- Clean professional layout
- Marketplace compliant
- Cross-industry adaptable
- No humans
- Zero hallucination

The result must resemble professionally designed retail marketing visual — scale-accurate, shadow-neutral, and product-faithful.

Strict immutability.
Strict scale normalization.
Strict shadow neutrality.
Strict marketing discipline.
`.trim();

// ─────────────────────────────────────────────────────────────────
// VENDOR PROMPT
//
// Base quality contract shared across all generation calls.
// Acts as the foundation quality floor before variant logic is added.
// ─────────────────────────────────────────────────────────────────
export const VENDOR_PROMPT = `
You are an AI product photography generator specialized in premium e-commerce visuals.

Goal:
Generate high-quality promotional images for a vendor product that can be used in online stores, advertisements, and brand catalogs.

Style Requirements:
- Create visually appealing, premium-quality product images.
- Maintain realistic product proportions and materials.
- Use professional lighting and cinematic shadows.
- Focus on brand storytelling and lifestyle presentation.
- Ensure the product remains the central focus of the image.

Environment Options:
- Modern lifestyle setting
- Minimal studio setup
- Premium showroom environment
- Clean gradient background

Image Quality Requirements:
- Ultra realistic product photography
- High resolution
- Clear sharp focus
- Balanced color grading
- Natural shadows and reflections

Guardrails:
- Do not distort the product shape.
- Do not add unrelated objects that hide the product.
- Do not place text, logos, or watermarks in the image.
- Do not generate copyrighted brand elements unless explicitly provided.
- Ensure the product remains clearly visible and recognizable.
`.trim();

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * All supported image generation variants.
 * Add new variants here and implement their mode prompt below.
 */
export type ImageVariant =
  | "main"         // Pure white catalog shot, centered
  | "lifestyle"    // Realistic premium environment, minimal
  | "specification"// Technical alignment, right-aligned, empty left side
  | "marketing";   // Advertising shot with mandatory text overlays (Headline + 3 features)

/** Real-world grounding data derived from the search pipeline */
export interface GroundingData {
  searchQuery?: string;
  topResultTitles?: string[];
  visualMatches?: Array<{ title?: string; snippet?: string }>;
}

/** Full context object passed into every prompt composition call */
export interface ProductContext {
  description: string;       // Required — AI vision output, the product's visual truth
  productName?: string;      // e.g. "Sony WH-1000XM5"
  category?: string;         // e.g. "electronics", "luxury", "decor", "food"
  keyFeatures?: string[];    // e.g. ["noise cancellation", "30hr battery"]
  dominantColor?: string;    // e.g. "matte black", "pearl white"
  environment?: string;      // e.g. "studio", "outdoor", "kitchen"
  groundingData?: GroundingData;
}

/** Benefit-driven marketing copy generated from product context */
export interface MarketingCopy {
  headline: string;
  subLine: string;
  featureHighlights: string[];
}

/** Output of composePrompt — the assembled prompt + optional marketing copy */
export interface BuiltPrompt {
  prompt: string;
  variant: ImageVariant;
  marketingCopy?: MarketingCopy;
}

/** Result of prompt safety validation */
export interface PromptValidationResult {
  valid: boolean;
  violations: string[];
  sanitized: string;
}

/** Output shape of doImagesBatch — matches existing system contract */
export interface GeneratedImageResult {
  url: string;          // base64 data-URI or Cloudinary URL
  name: string;         // "{productName}_{variant}"
  description: string;  // first 200 chars of the composed prompt
  type: ImageVariant;   // variant identifier
  keywords: string[];   // derived from context for search/tagging
}

// ─────────────────────────────────────────────────────────────────
// LAYER 1: BASE PROMPT
//
// Establishes core product identity: what the product IS.
// This layer is variant-agnostic — it never changes based on mode.
// ─────────────────────────────────────────────────────────────────
function buildBasePrompt(ctx: ProductContext): string {
  const parts: string[] = [];

  parts.push(`Subject: ${ctx.description}`);

  if (ctx.productName) {
    parts.push(`Product name: ${ctx.productName}`);
  }
  if (ctx.category) {
    parts.push(`Product category: ${ctx.category}`);
  }
  if (ctx.dominantColor) {
    parts.push(`Primary color: ${ctx.dominantColor}`);
  }
  if (ctx.keyFeatures?.length) {
    // Cap at 5 to avoid prompt bloat
    parts.push(`Key features: ${ctx.keyFeatures.slice(0, 5).join(", ")}`);
  }

  return parts.join(". ") + ".";
}

// ─────────────────────────────────────────────────────────────────
// LAYER 2: GROUNDING PROMPT
//
// Anchors image generation in real-world visual context from the
// search pipeline. Used as style reference ONLY — never as a template
// to copy from (the guardrails enforce this).
// ─────────────────────────────────────────────────────────────────
function buildGroundingPrompt(groundingData: GroundingData): string {
  const parts: string[] = [];

  if (groundingData.searchQuery) {
    parts.push(`Visual search context: "${groundingData.searchQuery}"`);
  }

  const titles = groundingData.topResultTitles?.filter(Boolean).slice(0, 3);
  if (titles?.length) {
    parts.push(`Similar product references (for style context only): ${titles.join("; ")}`);
  }

  if (parts.length === 0) return "";

  return (
    "Grounding context — use for lighting and style reference ONLY, " +
    "do NOT replicate these products: " +
    parts.join(". ") +
    "."
  );
}

// ─────────────────────────────────────────────────────────────────
// STYLE INTELLIGENCE
//
// Infers the optimal shooting style, lighting, and mood from the
// product's category and environment. Falls back to a clean studio
// default when no category signal is present.
//
// To add a new category: add an `if` branch below.
// ─────────────────────────────────────────────────────────────────
function applyStyleIntelligence(ctx: ProductContext): string {
  const category = (ctx.category ?? "").toLowerCase();
  const env = (ctx.environment ?? "").toLowerCase();

  if (
    category.includes("luxury") ||
    category.includes("premium") ||
    category.includes("jewel") ||
    category.includes("watch")
  ) {
    return (
      "Lighting: dramatic cinematic rim lighting with deep soft shadows. " +
      "Surface: marble or dark reflective plane. Mood: exclusive, aspirational."
    );
  }

  if (
    category.includes("tech") ||
    category.includes("electron") ||
    category.includes("gadget") ||
    category.includes("device") ||
    category.includes("computer")
  ) {
    return (
      "Lighting: clean, cool-toned diffused studio light. " +
      "Background: minimal white or dark gradient. Mood: futuristic, precision-engineered."
    );
  }

  if (
    category.includes("decor") ||
    category.includes("home") ||
    category.includes("furniture") ||
    category.includes("interior")
  ) {
    return (
      "Lighting: warm natural window light. " +
      "Setting: styled interior with complementary neutral props. Mood: cozy, aspirational living."
    );
  }

  if (
    category.includes("food") ||
    category.includes("beverage") ||
    category.includes("drink") ||
    category.includes("culinary")
  ) {
    return (
      "Lighting: soft top-down diffused overhead light. " +
      "Surface: natural wood or stone. Props: fresh ingredients as accents. Mood: appetizing, artisanal."
    );
  }

  if (
    category.includes("fashion") ||
    category.includes("apparel") ||
    category.includes("cloth") ||
    category.includes("accessory")
  ) {
    return (
      "Lighting: balanced editorial fashion lighting. " +
      "Background: clean neutral backdrop. Mood: confident, wearable, contemporary."
    );
  }

  if (
    env.includes("outdoor") ||
    env.includes("sport") ||
    env.includes("athletic") ||
    category.includes("sport")
  ) {
    return (
      "Setting: dynamic outdoor environment with natural daylight. " +
      "Mood: active, performance-oriented, energetic."
    );
  }

  // Default: universal clean studio treatment
  return (
    "Lighting: professional three-point studio lighting. " +
    "Background: clean gradient or white seamless. Mood: sharp, commercial, trustworthy."
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYER 3: MODE PROMPTS (variant-specific)
//
// Each entry defines the compositional intent for one image variant.
// To add a new variant: add its key to ImageVariant above, then add
// its mode prompt function here.
// ─────────────────────────────────────────────────────────────────
const VARIANT_MODE_PROMPTS: Record<ImageVariant, (ctx: ProductContext) => string> = {
  /**
   * MAIN: Pure white catalog shot.
   */
  main: (_ctx) =>
    `--- MODE: CLEAN CATALOG ---\nPure white (#FFFFFF) background. Product centered, 75% frame height. Ultra-soft contact shadow only. No text, no environment.\n\n${VENDOR_PROMPT}`,

  /**
   * LIFESTYLE: Realistic premium environment.
   */
  lifestyle: (ctx) => {
    const env = ctx.environment || "natural environment";
    return `--- MODE: LIFESTYLE ---\nENVIRONMENT: ${env}. Realistic, grounded surface. Product 65-85% frame height. No humans. Use grounding research to inform authentic styling.\n\n${VENDOR_PROMPT}`;
  },

  /**
   * SPECIFICATION: Technical alignment for labels.
   */
  specification: (_ctx) =>
    `--- MODE: SPECIFICATION ---\nWhite background. Product 65-75% width, aligned RIGHT. Leave LEFT 35% empty for arrows/labels.\n\n${VENDOR_PROMPT}`,

  /**
   * MARKETING: Advertising shot with mandatory text.
   */
  marketing: (ctx) => {
    const category = ctx.category || "product";
    const features = ctx.keyFeatures?.join(", ") || "";
    return `--- MODE: MARKETING ---\nPRODUCT: ${category}. FEATURES (use for headline/sub-line/3 highlights): ${features}. Premium subtle background. Headline max 6 words; 3 features 2-4 words each; dark gray typography; text outside product boundary.\n\n${VENDOR_PROMPT}`;
  },
};

// ─────────────────────────────────────────────────────────────────
// MARKETING INTELLIGENCE
//
// Generates benefit-driven copy from product context.
// Rules enforced here:
//   - No superlatives without a backing feature
//   - No invented capabilities (only keyFeatures used)
//   - No exaggeration — factual framing only
// ─────────────────────────────────────────────────────────────────
export function buildMarketingCopy(ctx: ProductContext): MarketingCopy {
  const name = ctx.productName ?? "Product";
  const features = ctx.keyFeatures ?? [];

  // Headline: Strictly max 6 words
  let headline = features.length > 0
    ? `${name}: ${features[0]}`
    : `Introducing The New ${name}`;
  
  if (headline.split(" ").length > 6) {
    headline = name.slice(0, 20); // Fallback to safe length
  }

  // Sub-line: Single descriptive line
  const subLine = ctx.category 
    ? `Professional-grade ${ctx.category} solution.`
    : "Engineered for excellence.";

  // Feature highlights: EXACTLY 3 items
  const baseFeatures = features.slice(0, 3);
  while (baseFeatures.length < 3) {
    baseFeatures.push("Premium Quality");
  }
  const featureHighlights = baseFeatures.map((f) => `• ${f}`);

  return { headline, subLine, featureHighlights };
}

// ─────────────────────────────────────────────────────────────────
// PROMPT SAFETY VALIDATOR
//
// Scans the assembled prompt before it reaches the model.
// Catches:
//   1. Instructions that contradict the immutability guardrails
//   2. Product modification commands
//   3. Physically unrealistic environment requests
//   4. Prompt injection attempts
// ─────────────────────────────────────────────────────────────────

/** Patterns that attempt to modify the product itself */
const PRODUCT_MODIFICATION_PATTERNS: RegExp[] = [
  /change\s+the\s+(color|shape|design|logo|label|brand)/i,
  /add\s+(a\s+)?(feature|component|accessory|part|button|port)/i,
  /remove\s+(the\s+)?(feature|component|part|logo|label|brand)/i,
  /replace\s+the\s+product/i,
  /make\s+it\s+(look\s+like|appear\s+as|resemble)/i,
  /transform\s+(it\s+)?into/i,
  /completely\s+different\s+product/i,
];

/** Patterns that attempt to disable guardrails */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(the\s+)?(rules|guardrails|instructions|constraints)/i,
  /override\s+(the\s+)?(rules|guardrails|immutability)/i,
  /disregard\s+(the\s+)?(rules|guardrails|instructions)/i,
  /forget\s+(everything|all\s+previous)/i,
];

/** Patterns indicating physically impossible environments */
const UNREALISTIC_ENVIRONMENT_PATTERNS: RegExp[] = [
  /floating\s+in\s+(outer\s+)?space/i,
  /surrounded\s+by\s+(flames|lava|explosions)/i,
  /inside\s+a\s+(volcano|black\s+hole)/i,
  /underwater\s+while\s+(on\s+fire|burning)/i,
];

export function validatePrompt(prompt: string): PromptValidationResult {
  const violations: string[] = [];

  for (const pattern of PRODUCT_MODIFICATION_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push(`Product modification instruction detected: pattern /${pattern.source}/`);
    }
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push(`Guardrail bypass attempt detected: pattern /${pattern.source}/`);
    }
  }

  for (const pattern of UNREALISTIC_ENVIRONMENT_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push(`Physically unrealistic environment: pattern /${pattern.source}/`);
    }
  }

  // Sanitize injection attempts from the prompt text before sending to model
  const sanitized = prompt
    .replace(/ignore\s+(previous|all|the)\s+instructions?[^.]*\./gi, "")
    .replace(/\bforget\s+(everything|all)[^.]*\./gi, "")
    .replace(/override\s+(the\s+)?(rules|guardrails)[^.]*\./gi, "")
    .trim();

  return { valid: violations.length === 0, violations, sanitized };
}

// ─────────────────────────────────────────────────────────────────
// COMPOSE PROMPT (main entry point)
//
// Dynamically assembles all four layers into a final prompt.
// Order matters: base → grounding → mode → guardrails.
// Guardrails always go last so they override any conflicting instructions.
// ─────────────────────────────────────────────────────────────────
export function composePrompt(variant: ImageVariant, ctx: ProductContext): BuiltPrompt {
  // Layer 1 — product identity (always present)
  const base = buildBasePrompt(ctx);

  // Layer 2 — real-world search grounding (only when available)
  const grounding = ctx.groundingData ? buildGroundingPrompt(ctx.groundingData) : "";

  // Layer 3 — variant-specific compositional intent
  const modeBuilder = VARIANT_MODE_PROMPTS[variant];
  const mode = modeBuilder(ctx);

  // Layer 4 — immutability guardrails (always last, always present)
  const guardrails = STRICT_IMMUTABILITY_GUARDRAILS;

  // Assemble in layer order, dropping empty sections
  const rawPrompt = [base, grounding, mode, guardrails].filter(Boolean).join("\n\n");

  // Safety pass before sending to model
  const validation = validatePrompt(rawPrompt);
  if (!validation.valid) {
    console.warn(
      `[promptBuilder] composePrompt(${variant}): ${validation.violations.length} violation(s) found:`,
      validation.violations
    );
  }

  // Marketing copy is only generated for visual-marketing variants
  const MARKETING_VARIANTS: ImageVariant[] = ["marketing"];
  const marketingCopy = MARKETING_VARIANTS.includes(variant)
    ? buildMarketingCopy(ctx)
    : undefined;

  return {
    prompt: validation.sanitized,
    variant,
    marketingCopy,
  };
}

// ─────────────────────────────────────────────────────────────────
// doImagesBatch
//
// Parallel generation across multiple variants.
// The `generator` parameter is intentionally injectable:
//   - Pass a Gemini generator for current production use
//   - Swap to OpenAI/Stable Diffusion by passing a different function
//   - No code changes required elsewhere in the system
//
// Output shape is identical to existing system contract:
//   { url, name, description, type, keywords }
// ─────────────────────────────────────────────────────────────────
export async function doImagesBatch(
  variants: ImageVariant[],
  ctx: ProductContext,
  /** Injectable generator — accepts a prompt, returns a data-URI or URL */
  generator: (prompt: string) => Promise<string>
): Promise<GeneratedImageResult[]> {
  const tasks = variants.map((variant) => {
    const built = composePrompt(variant, ctx);

    console.log(`\n======================================================`);
    console.log(`[PROMPT BUILDER] Assembled Prompt for "${variant.toUpperCase()}"\n`);
    console.log(built.prompt);
    console.log(`======================================================\n`);

    return generator(built.prompt)
      .then((url): GeneratedImageResult => ({
        url,
        name: `${ctx.productName ?? "product"}_${variant}`,
        // Truncate description to stay within reasonable metadata limits
        description: built.prompt.slice(0, 200),
        type: variant,
        keywords: [
          ctx.productName,
          ctx.category,
          ctx.dominantColor,
          variant,
          // Include up to 3 key features as searchable keywords
          ...(ctx.keyFeatures ?? []).slice(0, 3),
        ].filter((k): k is string => Boolean(k)),
      }))
      .catch((err: Error): null => {
        console.warn(`[doImagesBatch] Variant "${variant}" failed: ${err.message}`);
        return null;
      });
  });

  const settled = await Promise.all(tasks);

  // Filter out failed variants — partial success is acceptable
  return settled.filter((r): r is GeneratedImageResult => r !== null);
}
