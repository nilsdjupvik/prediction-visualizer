# Prediction Visualizer

An educational web app that shows how AI language models generate text — one token at a time. Type a prompt, watch the model pick each word, and explore the probability distributions behind every choice.

Built for kids (8+) and adults who want to understand how LLMs actually work, without the jargon.

## What it does

- **Token-by-token generation** from a local [Ollama](https://ollama.com) model with real-time streaming
- **Probability visualization** — see which words the model considered and how confident it was (spin wheel for kids, bar charts for advanced users)
- **Confidence sparkline** — a bird's-eye view of the model's certainty across the entire generation
- **Temperature live-preview** — drag the creativity slider and watch probability bars morph in real-time
- **"Guess the Word" game** — try to predict the next token before the AI reveals it
- **Story Remix** — at uncertain moments, YOU pick which word continues the story
- **Side-by-side comparison** — run the same prompt twice and see how sampling creates different outputs
- **Three difficulty levels** — Kids (visual metaphors, no numbers), Curious (percentages, charts), Advanced (raw logprobs, technical details)
- **AI misconception busters** — context-sensitive notes that remind kids the AI doesn't understand, plan, or fact-check
- **Challenges** — goal-oriented experiments: "Can you write a prompt that makes the AI super confident?"

## Prerequisites

- [Ollama](https://ollama.com) installed and running locally
- At least one model pulled (e.g., `ollama pull gemma3:270m`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Tech stack

Svelte 5 · SvelteKit · TypeScript · Tailwind CSS 4 · D3 (scales only)

No backend — the browser talks directly to Ollama's API. Production bundle is ~50 KB gzipped.

## How it works

The app sends prompts to Ollama's `/api/generate` endpoint with `logprobs: true`, which returns the top-N alternative tokens with their log probabilities at each generation step. Everything runs locally on your machine — no data is sent anywhere.
