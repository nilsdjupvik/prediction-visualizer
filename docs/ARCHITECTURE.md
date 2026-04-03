# Prediction Visualizer -- Architecture

## Overview

An educational web app that visualizes how LLM token prediction works. Users type a prompt, the app streams token-by-token generation from a local Ollama instance, and each token choice is accompanied by an animated probability distribution showing the top alternative tokens the model considered.

Target audience: children (8+) and adults. Runs entirely locally -- no cloud dependencies.

---

## 1. Ollama API Integration

### Capability Confirmation

Ollama **natively supports logprobs** since v0.12.11. The local installation is v0.20.0, which has full support.

### Endpoint: `POST /api/generate`

Request:

```json
{
  "model": "llama3.2:3b",
  "prompt": "Once upon a time",
  "stream": true,
  "logprobs": true,
  "top_logprobs": 10,
  "options": {
    "temperature": 0.8,
    "num_predict": 100
  }
}
```

Streaming response (NDJSON, one JSON object per line):

```json
{
  "model": "llama3.2:3b",
  "created_at": "2026-04-03T10:00:00Z",
  "response": " there",
  "done": false,
  "logprobs": [
    {
      "token": " there",
      "logprob": -0.523,
      "bytes": [32, 116, 104, 101, 114, 101],
      "top_logprobs": [
        { "token": " there", "logprob": -0.523, "bytes": [...] },
        { "token": " a", "logprob": -1.204, "bytes": [...] },
        { "token": ",", "logprob": -2.891, "bytes": [...] },
        { "token": " in", "logprob": -3.102, "bytes": [...] }
      ]
    }
  ]
}
```

Final chunk includes `"done": true` plus timing metadata (`total_duration`, `eval_count`, `eval_duration`).

### Key Parameters

| Parameter | Purpose | Our Default |
|-----------|---------|-------------|
| `logprobs` | Enable log probability output | `true` (always) |
| `top_logprobs` | Number of alternative tokens (0-20) | `10` |
| `temperature` | Randomness (higher = more diverse) | `0.8` |
| `num_predict` | Max tokens to generate | `100` |
| `top_k` | Limit sampling pool | `40` |
| `top_p` | Nucleus sampling threshold | `0.9` |

### CORS Configuration

Ollama runs on `http://localhost:11434`. A browser app on a Vite dev server (e.g. `http://localhost:5173`) is a different origin. Two options:

**Option A -- Direct browser connection (recommended for simplicity):**

Set the `OLLAMA_ORIGINS` environment variable before starting Ollama:

```bash
# macOS
launchctl setenv OLLAMA_ORIGINS "*"
# Then restart Ollama
```

The `ollama/browser` package handles streaming via the browser's native `ReadableStream` and `fetch` APIs.

**Option B -- Backend proxy:**

A small Vite dev-server middleware or standalone Express server proxies requests to Ollama. This avoids CORS configuration entirely but adds a moving part.

**Decision:** Use Option A (direct connection) for production simplicity, with a Vite proxy configured as a development convenience so no CORS setup is needed during development.

---

## 2. Tech Stack

### Framework: Svelte 5 + SvelteKit + Vite

**Why Svelte over React/Vue:**

1. **Built-in animations and transitions.** Svelte has first-class `transition:`, `animate:`, and `motion` primitives. No external animation library needed for the core experience. React and Vue require third-party libraries (Framer Motion, GSAP, Vue Motion).

2. **Surgical DOM updates.** Svelte compiles to imperative DOM operations -- no virtual DOM diffing. For a streaming visualization that updates on every token (potentially several per second), this is a measurable performance advantage.

3. **Minimal boilerplate.** A Svelte component is a `.svelte` file with `<script>`, markup, and `<style>` -- no JSX, no `setup()`, no hooks rules. For an educational project, the codebase stays readable and approachable.

4. **Proven for data visualization.** The D3 + Svelte combination is widely adopted by data journalism and visualization teams. Svelte handles the DOM; D3 handles the math (scales, layouts, interpolation).

5. **Small bundle.** Svelte compiles away the framework. The shipped JS for this app will be significantly smaller than an equivalent React or Vue app.

### Visualization: D3.js (utility only) + Svelte transitions

- **D3.js** for scales (`d3-scale`), color interpolation (`d3-interpolate`), and data utilities -- NOT for DOM manipulation.
- **Svelte's built-in transitions** (`fade`, `fly`, `slide`, `draw`, `tweened`, `spring`) for all animations.
- **SVG** for the probability distribution charts (bar charts, area charts). SVG elements are directly in Svelte templates, animated via Svelte reactivity.

### State Management: Svelte 5 Runes ($state, $derived, $effect)

Svelte 5's rune-based reactivity replaces stores for most use cases. A single reactive "generation session" object tracks:
- The growing list of generated tokens
- The currently focused/hovered token
- Generation parameters
- Connection status

No external state management library needed.

### Styling: Tailwind CSS 4

Utility-first CSS keeps styling co-located with components. Tailwind's animation utilities (`animate-*`, `transition-*`) complement Svelte transitions.

### Language: TypeScript

Full TypeScript throughout. Svelte 5 + SvelteKit have excellent TS support.

### HTTP Client: `ollama` (official JS library)

```
npm i ollama
```

Import from `ollama/browser` for the browser build. Handles streaming, NDJSON parsing, and provides TypeScript types for all API shapes.

---

## 3. Data Flow Architecture

```
+------------------+      +-------------------+      +---------------------+
|                  |      |                   |      |                     |
|  User types      |      |  Svelte App       |      |  Ollama Server      |
|  a prompt        +----->+  (Browser)        +----->+  localhost:11434    |
|                  |      |                   |      |                     |
+------------------+      |  1. Sends request |      |  2. Streams NDJSON  |
                          |     with logprobs |      |     token responses |
                          |                   +<-----+                     |
                          |  3. Parses each   |      +---------------------+
                          |     chunk into    |
                          |     TokenEvent    |
                          |                   |
                          |  4. Appends to    |
                          |     reactive      |
                          |     token list    |
                          |                   |
                          |  5. Visualization |
                          |     components    |
                          |     react to      |
                          |     state changes |
                          +-------------------+
```

### No Backend Needed

The browser talks directly to Ollama via the `ollama/browser` package. No Node.js server, no API routes, no WebSocket layer. SvelteKit is used only as a static SPA with Vite as the dev server.

### Vite Dev Proxy

During development, Vite proxies `/api` to `http://localhost:11434` to avoid CORS issues:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:11434',
        changeOrigin: true,
      }
    }
  }
});
```

In production (static build), the user configures `OLLAMA_ORIGINS` or the app connects directly to `localhost:11434`.

### Data Model

```typescript
/** A single alternative token with its probability */
interface TokenCandidate {
  token: string;        // The text, e.g. " there"
  logprob: number;      // Log probability, e.g. -0.523
  probability: number;  // Computed: Math.exp(logprob), e.g. 0.593
  bytes: number[];      // Raw byte representation
}

/** One step in the generation -- the chosen token + alternatives */
interface TokenEvent {
  index: number;              // Position in the sequence (0-based)
  chosen: TokenCandidate;     // The token the model actually picked
  alternatives: TokenCandidate[];  // top_logprobs alternatives (sorted by probability)
  timestamp: number;          // Performance.now() when received
}

/** The full generation session */
interface GenerationSession {
  id: string;                 // Unique session ID
  prompt: string;             // User's input prompt
  model: string;              // Ollama model name
  tokens: TokenEvent[];       // Growing list of generated tokens
  status: 'idle' | 'generating' | 'complete' | 'error';
  parameters: GenerationParameters;
  timing?: {                  // From Ollama's final response
    totalDuration: number;
    evalCount: number;
    evalDuration: number;
    tokensPerSecond: number;
  };
}

/** User-configurable generation parameters */
interface GenerationParameters {
  temperature: number;    // 0.0 - 2.0, default 0.8
  topK: number;           // 1 - 100, default 40
  topP: number;           // 0.0 - 1.0, default 0.9
  numPredict: number;     // 1 - 500, default 100
  topLogprobs: number;    // 1 - 20, default 10
}
```

### Probability Normalization

The `top_logprobs` array only contains the top-N tokens, not the full vocabulary (32k+). For visualization purposes, we normalize probabilities across the visible candidates:

```typescript
function normalizeTopLogprobs(candidates: TokenCandidate[]): TokenCandidate[] {
  const rawProbs = candidates.map(c => Math.exp(c.logprob));
  const sum = rawProbs.reduce((a, b) => a + b, 0);
  return candidates.map((c, i) => ({
    ...c,
    probability: rawProbs[i] / sum,  // Normalized to sum to 1.0
  }));
}
```

We also keep the raw probability (`Math.exp(logprob)`) available for display, with a clear label explaining that the bar chart shows "top 10 candidates" not "all possible tokens."

---

## 4. Component Architecture

```
App.svelte
 |
 +-- Header.svelte                     -- App title, model selector, connection status
 |
 +-- PromptInput.svelte                -- Text input area + "Generate" button
 |
 +-- GenerationView.svelte             -- Main content area (visible during/after generation)
 |    |
 |    +-- TokenStream.svelte           -- Horizontal/wrapped display of generated tokens
 |    |    |
 |    |    +-- TokenChip.svelte        -- Individual token (clickable, shows highlight on hover)
 |    |
 |    +-- ProbabilityPanel.svelte      -- Sidebar/panel showing distribution for selected token
 |    |    |
 |    |    +-- ProbabilityBar.svelte   -- Single bar in the distribution (animated)
 |    |    |
 |    |    +-- ProbabilityTooltip.svelte
 |    |
 |    +-- LiveDistribution.svelte      -- Animated chart that updates in real-time during generation
 |
 +-- ParameterControls.svelte          -- Temperature, top_k, top_p sliders
 |    |
 |    +-- SliderControl.svelte         -- Reusable labeled slider
 |
 +-- ExplanationPanel.svelte           -- Educational text explaining what the user is seeing
 |
 +-- ConnectionStatus.svelte           -- Ollama connection health indicator
```

### Component Responsibilities

**TokenStream** -- Renders the growing text as a sequence of `TokenChip` elements. Each chip is colored by its probability (green = high confidence, yellow = medium, red = low). Clicking a chip selects it and opens the `ProbabilityPanel`.

**TokenChip** -- A single token displayed as an inline badge. Uses Svelte `transition:fly` to animate in as tokens stream. Background color derived from probability via a D3 color scale.

**ProbabilityPanel** -- A vertical bar chart showing the top-N alternative tokens for the selected `TokenEvent`. The chosen token is highlighted. Bars animate to their final width using Svelte `tweened` stores.

**LiveDistribution** -- During active generation, shows the probability distribution for the most recently generated token. Automatically advances as new tokens arrive. Uses Svelte `spring` for smooth transitions between distributions.

**ParameterControls** -- Sliders for `temperature`, `top_k`, `top_p`, `num_predict`, and `top_logprobs`. Changes take effect on the next generation. Includes child-friendly labels and tooltips explaining each parameter.

**ExplanationPanel** -- Context-sensitive educational text. Changes based on what the user is interacting with. Examples:
- Hovering a high-probability token: "The model was very confident about this word!"
- Viewing a flat distribution: "The model wasn't sure here -- many words seemed equally likely."
- Adjusting temperature: "Higher temperature = more creative and surprising choices."

---

## 5. Streaming Integration Detail

```typescript
// lib/generation.svelte.ts

import { Ollama } from 'ollama/browser';

const ollama = new Ollama({ host: 'http://localhost:11434' });

export function createGenerationSession() {
  let tokens = $state<TokenEvent[]>([]);
  let status = $state<'idle' | 'generating' | 'complete' | 'error'>('idle');

  async function generate(prompt: string, params: GenerationParameters) {
    tokens = [];
    status = 'generating';

    try {
      const stream = await ollama.generate({
        model: 'llama3.2:3b',
        prompt,
        stream: true,
        logprobs: true,
        top_logprobs: params.topLogprobs,
        options: {
          temperature: params.temperature,
          top_k: params.topK,
          top_p: params.topP,
          num_predict: params.numPredict,
        },
      });

      let index = 0;
      for await (const chunk of stream) {
        if (chunk.logprobs?.length) {
          const lp = chunk.logprobs[0];
          const alternatives = normalizeTopLogprobs(
            lp.top_logprobs.map(t => ({
              token: t.token,
              logprob: t.logprob,
              probability: Math.exp(t.logprob),
              bytes: t.bytes,
            }))
          );

          tokens.push({
            index: index++,
            chosen: alternatives.find(a => a.token === lp.token) ?? alternatives[0],
            alternatives,
            timestamp: performance.now(),
          });
        }

        if (chunk.done) {
          status = 'complete';
        }
      }
    } catch (error) {
      status = 'error';
      throw error;
    }
  }

  function stop() {
    // AbortableAsyncIterator from ollama-js supports cancellation
    status = 'idle';
  }

  return {
    get tokens() { return tokens; },
    get status() { return status; },
    generate,
    stop,
  };
}
```

---

## 6. Performance Strategy

### Problem: Vocabulary-Scale Data

A typical LLM has a vocabulary of 32k-128k tokens. We only request `top_logprobs: 10` (configurable up to 20), which keeps each chunk small (~1-2 KB). This is critical -- requesting the full vocabulary distribution is not supported by the API and would be impractical.

### Problem: Animation During Fast Streaming

Ollama can generate 20-50 tokens/second on a decent GPU. At this rate, a new probability distribution arrives every 20-50ms. Strategy:

1. **Queue incoming tokens.** Use a small buffer that drains at a controlled rate (e.g., one token every 80ms minimum) to keep animations readable.
2. **Animate only the visible distribution.** Only the `LiveDistribution` and the latest `TokenChip` animate. Previous tokens are static.
3. **Use CSS transitions for bar charts.** CSS `transition: width 200ms ease-out` on SVG `<rect>` elements. The browser's compositor handles animation off the main thread.
4. **Virtualize the token stream.** For long generations (100+ tokens), only render visible tokens. Use `IntersectionObserver` or a simple window-based approach.

### Problem: Memory

Each `TokenEvent` with 10 alternatives is ~500 bytes. A 500-token generation is ~250 KB. Negligible. No special memory management needed.

---

## 7. Project Structure

```
predictionvisualizer/
  +-- src/
  |    +-- lib/
  |    |    +-- generation.svelte.ts    -- Core generation logic with Ollama
  |    |    +-- types.ts                -- TypeScript interfaces
  |    |    +-- probability.ts          -- Probability normalization, color scales
  |    |    +-- connection.ts           -- Ollama connection health check
  |    |
  |    +-- components/
  |    |    +-- Header.svelte
  |    |    +-- PromptInput.svelte
  |    |    +-- GenerationView.svelte
  |    |    +-- TokenStream.svelte
  |    |    +-- TokenChip.svelte
  |    |    +-- ProbabilityPanel.svelte
  |    |    +-- ProbabilityBar.svelte
  |    |    +-- LiveDistribution.svelte
  |    |    +-- ParameterControls.svelte
  |    |    +-- SliderControl.svelte
  |    |    +-- ExplanationPanel.svelte
  |    |    +-- ConnectionStatus.svelte
  |    |
  |    +-- routes/
  |    |    +-- +page.svelte            -- Main (only) page
  |    |    +-- +layout.svelte          -- App shell layout
  |    |
  |    +-- app.html                     -- HTML template
  |    +-- app.css                      -- Global styles / Tailwind imports
  |
  +-- static/                           -- Static assets (favicon, etc.)
  +-- docs/
  |    +-- ARCHITECTURE.md              -- This document
  +-- svelte.config.js
  +-- vite.config.ts
  +-- tailwind.config.js
  +-- tsconfig.json
  +-- package.json
```

### SvelteKit Adapter

Use `@sveltejs/adapter-static` to produce a static SPA. No server-side rendering needed -- the app is entirely client-side.

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: 'index.html', // SPA mode
    }),
  },
};
```

---

## 8. Educational UX Concepts (Architecture-Relevant)

These decisions shape the component tree and data flow:

### Token Coloring

Each `TokenChip` background color maps to the chosen token's probability:
- **Green** (>70% probability): "The model was very sure"
- **Yellow** (30-70%): "The model considered a few options"
- **Red** (<30%): "The model was uncertain -- many words seemed likely"

Implemented via a D3 sequential color scale: `d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1])`.

### Two Visualization Modes

1. **Live Mode** (during generation): The `LiveDistribution` component auto-advances, showing each token's distribution as it arrives. Tokens fly into the `TokenStream` one at a time.

2. **Explore Mode** (after generation): User clicks any token in the stream to inspect its distribution. The `ProbabilityPanel` slides in with the full bar chart.

### Parameter Playground

Sliders with real-time previews. Changing temperature doesn't regenerate -- it shows an explanation of what the change would do, with a "Regenerate" button. Each slider has a child-friendly label:
- Temperature: "Creativity" (with a thermometer icon)
- Top-K: "How many words to consider"
- Top-P: "Probability cutoff"

---

## 9. Dependency Summary

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `svelte` + `@sveltejs/kit` | Framework | Compiles away |
| `ollama` | Ollama client (browser build) | ~15 KB |
| `d3-scale` | Color and value scales | ~5 KB |
| `d3-interpolate` | Color interpolation | ~3 KB |
| `tailwindcss` | Utility CSS | Purged in production |
| `typescript` | Type checking | Dev only |

Total production JS bundle estimate: **< 50 KB** gzipped.

No heavyweight charting library. No state management library. No animation library. Svelte's built-in primitives and targeted D3 utilities handle everything.

---

## 10. Open Questions and Risks

### Risk: Ollama Not Running

The app must handle the case where Ollama is not running or not installed. The `ConnectionStatus` component pings `http://localhost:11434/api/tags` on mount and shows setup instructions if unreachable.

### Risk: Model Not Downloaded

If the user has Ollama but no models, generation fails. The `Header` component fetches available models via `GET /api/tags` and guides the user to pull one if the list is empty.

### Risk: CORS in Production

If the user builds and serves the app from a different origin than `localhost`, CORS must be configured. The setup guide in the app should explain `OLLAMA_ORIGINS`. The Vite proxy solves this during development.

### Open Question: Which Default Model?

The app should work with any Ollama model. A sensible default would be `llama3.2:3b` (small, fast, widely available). The UI should allow selecting any locally available model.

### Open Question: Mobile Layout

The two-panel layout (token stream + probability chart) works well on desktop. A mobile layout would need to stack these vertically or use a bottom sheet for the probability view. Not a launch blocker but worth considering for the component architecture (already modular enough to support both layouts).
