# Prediction Visualizer — Implementation Plan

**Date**: 2026-04-03
**Status**: Ready for implementation
**See also**: [ARCHITECTURE.md](./ARCHITECTURE.md), [../UX_DESIGN.md](../UX_DESIGN.md)

---

## Overview

An educational web app that visualizes how LLM token prediction works. Users type a prompt, a local Ollama model generates text token-by-token, and the app shows an animated probability distribution for each token — making the abstract concept of "how AI writes" tangible for children (8+) and adults.

### Key Insight

Ollama v0.20.0 natively supports `logprobs: true` with `top_logprobs: N` (1-20), returning the chosen token's log probability plus the top-N alternatives. CORS works out of the box for localhost. This means: **no backend, no proxy, no workarounds** — the browser talks directly to Ollama.

---

## Tech Stack

| Technology | Purpose | Why |
|---|---|---|
| **Svelte 5 + SvelteKit** | Framework | Built-in animations (`transition:`, `tweened`, `spring`), surgical DOM updates, tiny bundle, excellent for real-time data viz |
| **Vite** | Build tool | Bundled with SvelteKit, fast HMR |
| **TypeScript** | Language | Type safety for complex data flow |
| **Tailwind CSS 4** | Styling | Utility-first, complements Svelte scoped styles |
| **D3.js** (d3-scale, d3-interpolate) | Math/color only | Probability-to-color mapping, scales — NOT DOM manipulation |
| **ollama** (npm) | API client | Official JS client with browser build, streaming, TypeScript types |
| **@sveltejs/adapter-static** | Deployment | Pure SPA, no SSR needed |

**Estimated production bundle**: < 50 KB gzipped.

---

## Implementation Phases

### Phase 1: Project Scaffold + Ollama Connection
**Goal**: Working SvelteKit app that connects to Ollama and streams tokens.

1. **Scaffold SvelteKit project**
   - `npx sv create predictionvisualizer` with Svelte 5, TypeScript, Tailwind
   - Configure `adapter-static` for SPA mode
   - Set up Vite proxy to `localhost:11434` (dev convenience, not required)

2. **Define TypeScript types** (`src/lib/types.ts`)
   ```typescript
   interface TokenCandidate {
     token: string;
     logprob: number;
     probability: number;  // Math.exp(logprob)
     bytes: number[];
   }

   interface TokenEvent {
     index: number;
     chosen: TokenCandidate;
     alternatives: TokenCandidate[];  // Sorted by probability, normalized
     timestamp: number;
   }

   interface GenerationSession {
     id: string;
     prompt: string;
     model: string;
     tokens: TokenEvent[];
     status: 'idle' | 'generating' | 'complete' | 'error';
     parameters: GenerationParameters;
     timing?: { totalDuration: number; evalCount: number; tokensPerSecond: number };
   }

   interface GenerationParameters {
     temperature: number;    // 0.1 - 2.0
     topK: number;           // 5 - 50
     topP: number;           // 0.0 - 1.0
     numPredict: number;     // 10 - 500
     topLogprobs: number;    // 1 - 20
   }
   ```

3. **Ollama connection module** (`src/lib/connection.ts`)
   - Health check via `GET /api/tags`
   - Model discovery (list available models)
   - Connection status reactive state

4. **Generation engine** (`src/lib/generation.svelte.ts`)
   - Stream tokens from `/api/generate` with `logprobs: true`
   - Parse NDJSON chunks into `TokenEvent` objects
   - Normalize top_logprobs probabilities (sum to 1.0 across visible candidates)
   - Token buffer: queue incoming tokens, drain at configurable rate (80ms default) for readable animations
   - Support abort/cancel mid-generation

5. **Minimal UI**: Text input + "Generate" button + plain text output showing tokens as they arrive. Verify the data pipeline works end-to-end.

**Default model**: `gemma3:270m` (fastest, 291 MB, ~100 tok/s). For Qwen3 models, always send `think: false`.

---

### Phase 2: Core Visualization — Token Stream + Probability Bars

**Goal**: Tokens appear as color-coded chips. Clicking a chip shows a probability bar chart.

1. **Token chip component** (`TokenChip.svelte`)
   - Inline badge showing the token text
   - Background color from probability: blue (>30%, high confidence) → amber (10-30%) → rose (<10%, surprising)
   - Color via D3 sequential scale: `d3.scaleSequential(d3.interpolateRdYlBu).domain([0, 1])`
   - Animate in with Svelte `transition:fly` as tokens stream
   - Click/tap to select and open probability panel
   - Hover tooltip: "{probability}% — {confidence label}"

2. **Token stream component** (`TokenStream.svelte`)
   - Wrapping inline layout of `TokenChip` elements
   - Prompt text shown dimmed before generated tokens
   - Auto-scroll to latest token during generation
   - Virtualize after 100+ tokens (IntersectionObserver)

3. **Probability panel** (`ProbabilityPanel.svelte`)
   - Vertical bar chart: each bar = one alternative token
   - Bar width proportional to normalized probability
   - Chosen token highlighted with gold accent
   - Bars animate to final width using Svelte `tweened`
   - Shows on the right (desktop) or bottom sheet (mobile <640px)

4. **Live distribution** (`LiveDistribution.svelte`)
   - During generation: auto-advancing probability chart for the latest token
   - Smooth transitions between distributions using `spring`
   - After generation: switches to click-to-explore mode

---

### Phase 3: The Spin Wheel (Primary Educational Metaphor)

**Goal**: Animated carnival wheel makes probability intuitive for children.

1. **Spin wheel component** (`SpinWheel.svelte`)
   - SVG-based pie/wheel with slices sized by probability
   - Each slice labeled with the candidate token
   - Colors match the probability gradient (blue → amber → rose)
   - Animation sequence per token:
     1. Wheel appears with candidates on slices
     2. Spins (CSS keyframe, cubic-bezier ease-out, ~800ms)
     3. Lands on chosen token — slice expands, optional confetti
     4. Token flies from wheel to text strip (translate animation, 300ms)
     5. Wheel fades, next token begins
   - Temperature affects spin behavior: low = quick snap, high = long wild spin
   - `prefers-reduced-motion`: replace with progress bar fill

2. **Speed control**: Turtle (2s/token) / Default (1s) / Rabbit (200ms, skip wheel)

3. **Pause/resume**: Freeze mid-spin with "Paused" overlay

---

### Phase 4: Educational Features + Progressive Disclosure

**Goal**: Three difficulty levels and learning mode.

1. **Difficulty level system**
   - State in `localStorage`, switchable from header
   - **Kids**: Wheel animation, color chips, no numbers, confetti on rare tokens, "Did You Know?" cards every 5 tokens
   - **Curious**: Adds percentages on chips, bar charts in explorer, top-p slider, "what-if" branching
   - **Advanced**: Adds raw logprobs (mono font), all parameter controls, technical labels

2. **Parameter controls** (`ParameterControls.svelte`)
   - Temperature: ice-to-flame slider with color-shifting track, labels "Predictable" → "Wild"
   - Top-k: "How many words to consider" (5-50)
   - Top-p: "Probability cutoff" (Curious/Advanced only)
   - All with child-friendly labels + `[?]` info tooltips

3. **Learning mode** — 5-step guided overlay walkthrough:
   - Step 1: "The AI reads your words" (robot illustration)
   - Step 2: "It guesses the next word" (wheel with 3 slices)
   - Step 3: "It spins the wheel!" (animated demo)
   - Step 4: "Then it does it again..." (token strip filling)
   - Step 5: "You're in control!" (temperature slider demo)

4. **"Did You Know?" cards** (Kids mode): Fun facts every 5 tokens
   - "This AI has read more text than a person could read in 10,000 years!"
   - "Try the same prompt twice — you might get different stories!"

5. **Experiment prompts**: After generation, suggest: "Crank temperature to FLAME and try again!"

---

### Phase 5: Token Explorer + "What If" Branching

**Goal**: Deep exploration of alternatives and branching paths.

1. **Token explorer** (tap any chip):
   - Context: "...there was a [?]..."
   - Bubble view: candidates as floating bubbles, size = probability (log-scaled), gold ring on chosen
   - Bar chart (Curious+): horizontal bars with percentages
   - Raw logprobs (Advanced): mono font readout

2. **"What if" branching** (Curious/Advanced):
   - Tap any alternative token to fork generation from that point
   - New text strip below original with visual branch line
   - Limit to 2 visible branches to avoid clutter

---

### Phase 6: Polish, Accessibility, and Edge Cases

1. **Connection handling**:
   - Ollama not running: Setup guide with numbered steps
   - No models installed: Guide to `ollama pull gemma3:270m`
   - Model loading (first request slow): "Loading model..." with progress

2. **WCAG accessibility**:
   - All color meaning duplicated by shape/icon
   - Focus indicators (2px solid accent, 2px offset)
   - ARIA live regions for wheel announcements
   - Keyboard navigation through all controls and token chips
   - 44px minimum touch targets
   - No flashing >3Hz

3. **Sound design** (optional, off by default):
   - Token chosen: soft pop, Rare token: "ding!", Wheel: whoosh/click

4. **Responsive layout**:
   - Desktop: side-by-side (token stream + wheel/panel)
   - Mobile (<640px): stacked, wheel as bottom sheet

5. **Settings panel**: Model selector, host/port config, sound toggle, difficulty level

---

## Project Structure

```
predictionvisualizer/
  src/
    lib/
      types.ts                 # TypeScript interfaces
      generation.svelte.ts     # Core streaming + token parsing
      connection.ts            # Ollama health check + model discovery
      probability.ts           # Normalization, color scales
      education.ts             # Fun facts, experiment prompts, level config
    components/
      Header.svelte            # Logo, model selector, level toggle, connection dot
      PromptInput.svelte       # Text input, suggestion chips, generate button
      GenerationView.svelte    # Main layout: token stream + visualization panel
      TokenStream.svelte       # Wrapped token chip container
      TokenChip.svelte         # Individual colored token badge
      SpinWheel.svelte         # SVG carnival wheel animation
      ProbabilityPanel.svelte  # Bar chart sidebar for selected token
      ProbabilityBar.svelte    # Single animated bar
      LiveDistribution.svelte  # Auto-advancing chart during generation
      TokenExplorer.svelte     # Bubble view + branching for token detail
      ParameterControls.svelte # Temperature, top-k, top-p sliders
      SliderControl.svelte     # Reusable labeled slider
      SpeedControl.svelte      # Turtle / default / rabbit toggle
      ExplanationPanel.svelte  # Context-sensitive educational text
      LearningMode.svelte      # 5-step guided walkthrough overlay
      DidYouKnow.svelte        # Fun fact cards
      ConnectionStatus.svelte  # Health indicator + setup guide
      SettingsPanel.svelte     # Model, host, sound, level config
    routes/
      +page.svelte             # Main (only) page
      +layout.svelte           # App shell
    app.html
    app.css                    # Tailwind imports + CSS custom properties
  static/
    favicon.svg
  docs/
    ARCHITECTURE.md
    IMPLEMENTATION_PLAN.md
  UX_DESIGN.md
  svelte.config.js
  vite.config.ts
  tailwind.config.js
  tsconfig.json
  package.json
```

---

## Ollama API Quick Reference

### Generate with logprobs
```
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "gemma3:270m",
  "prompt": "Once upon a time",
  "stream": true,
  "logprobs": true,
  "top_logprobs": 10,
  "think": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 100,
    "top_k": 40,
    "top_p": 0.9
  }
}
```

### Discover models
```
GET http://localhost:11434/api/tags
```

### Key notes
- CORS works for localhost origins — no proxy needed
- Logprobs are `ln(probability)` — convert: `Math.exp(logprob) * 100` = percentage
- Qwen3 models: always send `"think": false` to disable reasoning chain
- First request loads model (1-15s); use `"keep_alive": "5m"` to keep warm
- `gemma3:270m` recommended as default (291 MB, ~100 tok/s)

---

## Design Tokens (CSS Custom Properties)

```css
/* Core palette */
--pv-bg: #0f1117;
--pv-surface: #1c1f2b;
--pv-surface-raised: #252839;
--pv-text-primary: #f0f2ff;
--pv-text-secondary: #9196b8;

/* Probability gradient (colorblind-safe) */
--pv-prob-high: #4b9eff;   /* blue — very likely */
--pv-prob-mid: #f5a623;    /* amber — possible */
--pv-prob-low: #e05c7a;    /* rose — surprising */

/* Accent */
--pv-accent: #7c6cff;      /* purple — chosen token */
--pv-chosen-ring: #ffd166;  /* gold — chosen bubble */

/* Typography */
--pv-font-display: 'Nunito', system-ui, sans-serif;
--pv-font-body: 'Inter', system-ui, sans-serif;
--pv-font-mono: 'JetBrains Mono', monospace;
```

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Ollama not installed/running | ConnectionStatus component with setup guide |
| No models pulled | Model discovery + "pull gemma3:270m" instructions |
| Slow first request (model loading) | "Loading model..." state with friendly message |
| Tokens are subwords, not whole words | Display raw tokens; tooltip explains tokenization |
| Very fast generation overwhelms animation | Token buffer drains at controlled rate (80ms min) |
| Long generations | Soft prompt at 200 tokens: "Stop here?" |
| Missing logprob data (edge case) | Graceful degradation: hide wheel, neutral gray chips |
| Mobile layout constraints | Bottom sheet for wheel, stacked layout, larger touch targets |
