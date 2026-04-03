# Prediction Visualizer — UX Design Document

**Version**: 1.0  
**Date**: 2026-04-03  
**Audience**: Children 8+ and adults  
**Goal**: Make "how AI generates text" tangible, playful, and educational

---

## 1. Design Principles

1. **Concrete before abstract** — always show the visual metaphor before numbers
2. **Delight, don't overwhelm** — one thing at a time; progressive reveal
3. **Safe to explore** — every control is reversible, nothing breaks
4. **Honest** — the AI looks uncertain because it IS uncertain; show that honestly
5. **Scoped styles** — all CSS uses a `.pv-` prefix namespace; no global resets

---

## 2. Visual Metaphors

### 2a. Primary Metaphor: The Spin Wheel (Token Picker)

When the model is choosing the next token, animate a spinning wheel (like a carnival prize wheel). Each slice represents a candidate token. Slice SIZE is proportional to probability. The wheel spins and lands on the chosen token.

- High probability token = big slice = wheel almost always lands there
- Low probability token = tiny slice = rare, exciting when it lands
- Temperature high = wheel spins faster and longer before settling (more unpredictable)
- Temperature low = wheel barely spins, quickly snaps to the biggest slice

**Why this works for children**: They already know carnival wheels. "The AI spins a wheel to pick the next word" is immediately graspable.

### 2b. Secondary Metaphor: Bubbles (Exploration View)

When a user taps a generated token to explore alternatives, the candidates float up as bubbles. Bigger bubble = more probable. Bubbles drift gently — the chosen token's bubble has a gold ring.

### 2c. Temperature Metaphor: Thermometer / Mood Dial

A visual slider shaped like a temperature dial:
- Left end: ice cube icon, label "Safe & Predictable"
- Middle: sun icon, label "Balanced"
- Right end: flame icon, label "Wild & Surprising"

The background of the control tints from cool blue (left) to warm orange/red (right).

---

## 3. Color System (CSS Variables)

```
--pv-bg:             #0f1117   (dark void — tokens feel like light emerging)
--pv-surface:        #1c1f2b
--pv-surface-raised: #252839
--pv-border:         #333654

--pv-text-primary:   #f0f2ff
--pv-text-secondary: #9196b8
--pv-text-muted:     #575a75

/* Probability gradient — colorblind-safe (blue-orange, not red-green) */
--pv-prob-high:      #4b9eff   (blue  — "very likely")
--pv-prob-mid:       #f5a623   (amber — "possible")
--pv-prob-low:       #e05c7a   (rose  — "surprising / rare")

/* Accent */
--pv-accent:         #7c6cff   (purple — chosen token highlight)
--pv-chosen-ring:    #ffd166   (gold ring on chosen bubble)

/* Semantic */
--pv-success:        #36d399
--pv-warning:        #fbbd23
--pv-error:          #ff6b6b
```

**Colorblind safety**: The blue-amber-rose gradient is distinguishable under deuteranopia and protanopia. Never rely on red/green alone to convey meaning. A secondary hatch pattern is added to "surprise" tokens for those with color vision deficiency.

**Motion safety**: All animations respect `prefers-reduced-motion`. When reduced motion is on, the spin wheel is replaced with a simple progress-bar fill; bubbles appear instantly without float animation.

---

## 4. Typography

```
--pv-font-display:  'Nunito', system-ui, sans-serif   (rounded, friendly)
--pv-font-body:     'Inter', system-ui, sans-serif
--pv-font-mono:     'JetBrains Mono', monospace       (logprobs / advanced)

--pv-text-xl:   clamp(1.5rem, 3vw, 2rem)
--pv-text-lg:   1.25rem
--pv-text-base: 1rem
--pv-text-sm:   0.875rem
--pv-text-xs:   0.75rem
```

Minimum body text: 16px. Token chips: 18px for readability.

---

## 5. Screens and Layouts

### Screen 1: Welcome / Input View

**Purpose**: Orient the user, capture a prompt, set difficulty level.

```
+--------------------------------------------------+
|  [logo: spinning coin icon]  PREDICTION VISUALIZER |
|  "Watch an AI think, one word at a time"          |
+--------------------------------------------------+
|                                                  |
|  DIFFICULTY:  [ Kids ]  [ Curious ]  [ Advanced ] |
|                                                  |
|  +--------------------------------------------+  |
|  |  Type something for the AI to finish...    |  |
|  |  "Once upon a time there was a..."         |  |
|  +--------------------------------------------+  |
|                                                  |
|  SUGGESTED PROMPTS (chips, tap to insert):       |
|  [The robot wanted to...] [In a land far away...]|
|  [The best pizza topping is...] [Why is the sky] |
|                                                  |
|  HOW CREATIVE?                                   |
|  [ice] ----O-------------- [flame]               |
|         Safe        Wild                         |
|                                                  |
|  HOW MANY CHOICES? (top-k)                       |
|  [ 5 words ] < slider > [ 50 words ]             |
|  "How many options the AI considers each time"   |
|                                                  |
|       [ START GENERATING  >  ]                   |
|                                                  |
+--------------------------------------------------+
```

**Details**:
- Difficulty buttons are large pill-shaped toggles (min 44px tap target)
- Prompt text area: single line, large font (24px), prominent caret
- Prompt suggestion chips scroll horizontally on mobile
- Temperature slider shows the ice/flame icons inline; the track color fills left-to-right warm
- "Start Generating" button is wide, uses `--pv-accent`, subtle pulse animation on idle
- Keyboard: Enter submits; Tab moves through controls logically

---

### Screen 2: Generation View (Main Visualization)

**Purpose**: Show tokens appearing one by one with probability context.

```
+--------------------------------------------------+
|  < Back    [Speed: turtle / rabbit]   [Pause ||] |
+--------------------------------------------------+
|                                                  |
|  PROMPT (dims after generation starts):          |
|  "Once upon a time there was a"                  |
|                                                  |
|  GENERATED TEXT:                                 |
|  Once upon a time there was a [little]_ |cursor| |
|                                                  |
|  Each token is a chip:                           |
|  [Once][upon][a][time][there][was][a]            |
|  Chips tinted by surprise level:                 |
|    blue = expected  amber = interesting  rose = !! |
|                                                  |
|  +---------WHEEL PANEL (right / bottom)--------+ |
|  |                                             | |
|  |   Considering next word...                  | |
|  |                                             | |
|  |         /--[little 42%]--\                  | |
|  |       [the 28%]   [a 14%]                   | |
|  |     [his 8%]   [great 5%]  [3 more...]      | |
|  |                                             | |
|  |   [  SPIN WHEEL ANIMATION  ]                | |
|  |   (each candidate = a colored slice)        | |
|  |   (lands on "little" with pop + confetti)   | |
|  |                                             | |
|  +---------------------------------------------+ |
|                                                  |
|  [ Tap any word to explore alternatives ]        |
+--------------------------------------------------+
```

**Token chip behavior**:
- Chips pulse in gently as they appear (scale 0.8 -> 1.0, opacity 0 -> 1, 200ms)
- Color: probability-tinted background, white text
  - >30% probability = `--pv-prob-high` tint
  - 10-30% = `--pv-prob-mid` tint
  - <10% = `--pv-prob-low` tint (+ small star icon for "rare pick!")
- On hover/focus: chip lifts (box-shadow), shows tooltip: "42% likely — common choice"
- Gold ring on the chip that was just chosen (fades after 2s)

**Wheel animation sequence** (per token):
1. Wheel fades in with candidates labeled on slices
2. Wheel spins (CSS keyframe, easing: cubic-bezier ease-out, 0.8s default)
3. Wheel lands — chosen slice expands slightly, plays a soft "click" sound (optional, off by default)
4. Token flies from wheel to text strip (translate animation, 300ms)
5. Wheel fades out, next token begins

**Speed control**: Turtle = 2s per token, default = 1s, Rabbit = 200ms. At rabbit speed, wheel animation is skipped and tokens appear as pulses.

**Pause**: Freezes wheel mid-spin. "Paused" banner overlays. Resume continues the spin.

**Layout**: On desktop, wheel panel sits to the right. On mobile (<640px), wheel panel slides up from the bottom as a modal sheet.

---

### Screen 3: Exploration View (Token Detail)

**Purpose**: Tap any generated token to see what alternatives the model considered.

Triggered by: tap/click on any token chip in the text strip.

```
+--------------------------------------------------+
|  Token Explorer              [ x close ]         |
+--------------------------------------------------+
|                                                  |
|  At this position:                               |
|  "...there was a [?]..."                         |
|  (preceding context shown, position highlighted) |
|                                                  |
|  The AI's top candidates were:                   |
|                                                  |
|  BUBBLE VIEW:                                    |
|                                                  |
|     [  little  ]  <-- big bubble, gold ring      |
|       42%  CHOSEN                                |
|                                                  |
|    [ the ]  [ a ]                                |
|     28%      14%                                 |
|                                                  |
|   [his]  [great]  [old]                          |
|    8%      5%       3%                           |
|                                                  |
|  (Curious/Advanced only:)                        |
|  BAR CHART:                                      |
|  little =============================== 42%      |
|  the    =====================           28%      |
|  a      ===========                    14%       |
|  his    ======                          8%       |
|  great  ====                            5%       |
|                                                  |
|  (Advanced only:)                                |
|  RAW LOGPROBS:                                   |
|  little: -0.868  the: -1.273  a: -1.966 ...      |
|                                                  |
|  [  What if the AI had picked "the" instead?  ]  |
|  (re-runs generation from this branch)           |
|                                                  |
+--------------------------------------------------+
```

**Bubble physics**: Bubbles float in a confined area. Size = log-scaled probability (to avoid the top candidate being 10x the others visually). On hover, bubble shows exact percentage. All bubbles are keyboard-focusable (Tab order by probability rank).

**"What if" branching**: Tap any alternative token to fork the generation from that point. A new text strip begins below the original, with a visual branch line connecting the fork point. Limited to 2 branches visible at once to avoid clutter.

---

### Screen 4: Learning Mode (Step-by-step Walkthrough)

**Purpose**: Guided tour for first-time users, especially children.

Activated by: "How does this work?" button on welcome screen, or "?" button during generation.

**Step flow** (5 steps, each is a focused overlay card):

```
STEP 1/5
+--------------------------------------------+
|  The AI reads your words...                |
|                                            |
|  [illustration: robot reading a book]      |
|                                            |
|  When you type "Once upon a time",         |
|  the AI has read MILLIONS of stories.      |
|  It knows what words usually come next!    |
|                                            |
|  [ Next > ]                                |
+--------------------------------------------+

STEP 2/5
+--------------------------------------------+
|  It guesses the next word                  |
|                                            |
|  [wheel illustration, 3 slices]            |
|  "little" (big slice)                      |
|  "great" (medium slice)                    |
|  "dark" (small slice)                      |
|                                            |
|  Bigger slice = the AI thinks it's         |
|  more likely. Like a lottery ticket —      |
|  but you can see whose ticket is biggest!  |
|                                            |
|  [ Next > ]                                |
+--------------------------------------------+

STEP 3/5
+--------------------------------------------+
|  It spins the wheel!                       |
|                                            |
|  [animated wheel spinning and landing]     |
|                                            |
|  Most of the time it lands on the          |
|  biggest slice. But sometimes — surprise!  |
|  It picks something unexpected.            |
|                                            |
|  [ Next > ]                                |
+--------------------------------------------+

STEP 4/5
+--------------------------------------------+
|  Then it does it again. And again...       |
|                                            |
|  [token strip filling: "Once upon a time   |
|   there was a little..."]                  |
|                                            |
|  One word at a time. That's how the        |
|  whole story gets written!                 |
|                                            |
|  [ Next > ]                                |
+--------------------------------------------+

STEP 5/5
+--------------------------------------------+
|  You're in control!                        |
|                                            |
|  [temperature slider, ice to flame]        |
|                                            |
|  Turn it toward FLAME and the AI           |
|  spins the wheel more wildly —             |
|  more surprise words get chosen!           |
|                                            |
|  Turn it toward ICE and the AI plays       |
|  it safe — picks the most expected words.  |
|                                            |
|  [ Try it yourself! ]                      |
+--------------------------------------------+
```

**Navigation**: Large prev/next buttons, step dots at bottom, skip button top-right. Overlay darkens background but keeps app visible underneath for context.

---

## 6. Interactive Controls — Design Specs

### Temperature Slider

```
[ice icon] -----O---------- [flame icon]
             ^ knob
Track: gradient left blue -> right orange-red
Knob: 36px circle, white fill, colored border matching track position
Label below: "Predictable" | "Balanced" | "Creative" | "Wild"
```
- Range maps to model temperature: 0.1 (ice) to 2.0 (flame)
- ARIA label: "Creativity level, from predictable to wild"
- Keyboard: arrow keys in 0.1 increments

### Top-k Slider

```
[ 5 words ] <============O=====> [ 50 words ]
Label: "The AI considers 20 options each step"
```
- Shows live count in label as user drags
- Tooltip: "Lower = AI stays focused. Higher = AI considers more unusual words."

### Top-p Slider (Curious / Advanced only)

```
Nucleus sampling threshold: 0.7
[ less variety ] <======O==========> [ more variety ]
```

### Speed Control

Three icon buttons in a button group:
```
[ turtle ] [ default ] [ rabbit ]
```
Selected state: `--pv-accent` background, white icon

---

## 7. Progressive Disclosure — Level Behaviors

| Feature | Kids | Curious | Advanced |
|---|---|---|---|
| Spin wheel animation | Full | Abbreviated | Optional off |
| Token probability colors | Yes | Yes | Yes |
| Probability percentages on chips | No | Yes | Yes |
| Bar chart in Explorer | No | Yes | Yes |
| Raw logprobs | No | No | Yes |
| Top-p control | No | Yes | Yes |
| Technical vocabulary | No | Partial | Full |
| "What if" branching | No | Yes | Yes |
| Confetti on rare token | Yes | Yes | Optional |

Level is persisted in `localStorage` and can be changed at any time from the nav bar.

---

## 8. Educational Moments

### Tooltips / Info Bubbles

Every control has an `[?]` icon. Hover/tap opens a floating card:

- Temperature `[?]`: "Higher temperature = the AI takes more risks. Like choosing a random crayon instead of your favorite color!"
- Logprob `[?]`: "A logprob of -0.9 means this word had about a 40% chance. More negative = more surprised the AI is!"

### "Did You Know?" Cards

Appear after every 5 generated tokens (Kids mode only). Tap to dismiss.

Examples:
- "This AI has read more text than a person could read in 10,000 years!"
- "The AI doesn't 'know' what it will say next until it picks the word — just like you!"
- "Try the same prompt twice — you might get completely different stories!"

### Experiment Prompts

After generation completes, show a "Try This!" panel:
- "Now crank the temperature to FLAME and try the same prompt"
- "Click 'the' in your story — what else could the AI have chosen?"
- "Try a very short prompt. What about a very long one?"

---

## 9. Layout and Navigation — Full Structure

### App Shell

```
+--------------------------------------------------------------------+
| [logo] Prediction Visualizer        [Level: Kids] [How it works?] |
+--------------------------------------------------------------------+
|                                                                    |
|   MAIN CONTENT AREA (varies by screen)                             |
|                                                                    |
+--------------------------------------------------------------------+
| [New prompt] [History: 3 runs]         [Settings: model/port]     |
+--------------------------------------------------------------------+
```

- Max width: 1100px, centered
- Single scrollable page — no hard navigation, screens transition in-place
- Bottom bar sticks only when content overflows viewport height

### Mobile Layout (< 640px)

- Controls stack vertically
- Wheel panel = bottom sheet (slides up, 60vh)
- Token strip wraps to multiple lines
- Font size bumped +2px for readability
- All tap targets minimum 44x44px

### Keyboard Navigation Order

1. Level selector
2. Prompt input
3. Suggestion chips (horizontal)
4. Temperature slider
5. Top-k slider
6. Start button
7. During generation: Pause, Speed, Back
8. Token chips (Tab through each, Enter to explore)
9. Explorer: bubble alternatives (Tab by rank), What-if button, Close

Focus ring: 2px solid `--pv-accent`, 2px offset, visible in both light and dark contexts.

---

## 10. Animation Inventory

| Animation | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|
| Token chip appear | 200ms | ease-out | instant show |
| Wheel spin | 800ms default | cubic-bezier(0.2, 0, 0.1, 1) | progress bar fill |
| Token fly to strip | 300ms | ease-in-out | instant place |
| Bubble float | continuous 3s loop | ease-in-out | static |
| Branch line draw | 400ms | linear | instant |
| Level transition | 250ms fade | ease | instant |
| Confetti burst | 600ms | ease-out | none (skip entirely) |

---

## 11. States and Edge Cases

### Loading / Connecting to Ollama

```
+----------------------------------+
|  Connecting to your AI model...  |
|  [spinner]                       |
|  (running locally on your device)|
|                                  |
|  Not connected?                  |
|  [Show setup instructions]       |
+----------------------------------+
```

Setup instructions show simple numbered steps: install Ollama, run the model, reload.

### Model Thinking (slow token generation)

After 1.5s without a new token: show a subtle "thinking..." pulse on the wheel. After 5s: show "This model is a little slow — that's OK, it's thinking hard!"

### Empty Probability Data

If the model returns no logprob data: hide the wheel entirely, show tokens appearing with a neutral gray chip color. Show a non-alarming banner: "Probability data not available for this model — try a different one in Settings."

### Long Generations

After 200 tokens: soft prompt "That's a long story! Want to stop here?" with Continue / Stop buttons.

---

## 12. WCAG Accessibility Checklist

- [x] All color communication is duplicated by shape/icon (not color alone)
- [x] Colorblind-safe palette (blue-amber-rose, not red-green)
- [x] Minimum contrast 4.5:1 for body text, 3:1 for large/UI text
- [x] All interactive elements have visible focus indicators
- [x] All animations respect `prefers-reduced-motion`
- [x] All images and icons have `alt` text or `aria-label`
- [x] Spin wheel has ARIA live region announcing the chosen token
- [x] Token chips are keyboard-navigable, activatable with Enter/Space
- [x] Sliders use `<input type="range">` with ARIA labels and live value readout
- [x] Explorer modal traps focus and restores on close
- [x] Touch targets minimum 44x44px
- [x] No seizure-risk animations (no flashing >3Hz)
- [x] Text resizable to 200% without horizontal scrolling
- [x] Logical heading hierarchy (h1 > h2 > h3)
- [x] Form controls have visible labels (not placeholder-only)

---

## 13. Sound Design (optional, off by default)

All sounds gated behind a "Sound effects" toggle in Settings.

| Event | Sound |
|---|---|
| Token chosen | soft pop (220ms) |
| Rare token (< 5%) | delighted "ding!" |
| Wheel start | light whoosh |
| Wheel land | satisfying click |
| Learning mode step | gentle chime |

Sounds are short (<300ms), non-startling, and pitched to feel playful not alarming.

---

## 14. Settings Panel

Accessible from header icon. Contains:
- Ollama model selector (dropdown of available local models)
- Ollama host/port (default: localhost:11434)
- Sound effects toggle
- Level selector (duplicate of header for discoverability)
- "Reset to defaults" button

---

## 15. Visual Identity

- Logo: a spinning coin icon (two-tone, `--pv-accent`) — coin flip = probability
- App name: "Prediction Visualizer" in `--pv-font-display`, bold
- Tagline: "Watch an AI think, one word at a time"
- Dark background default (easier to make token chips pop)
- No stock photos — use simple SVG illustrations (robot, wheel, bubbles)

---
