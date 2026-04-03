<script lang="ts">
	import type { TokenEvent, DifficultyLevel } from '$lib/types.js';

	let {
		event,
		level,
		tokenCount,
		status
	}: {
		event: TokenEvent | null;
		level: DifficultyLevel;
		tokenCount: number;
		status: 'idle' | 'generating' | 'complete' | 'error';
	} = $props();

	interface Insight {
		icon: string;
		text: string;
	}

	const insight = $derived<Insight | null>(getInsight());
	const misconception = $derived<Insight | null>(getMisconceptionBuster());

	function getInsight(): Insight | null {
		if (!event || event.alternatives.length === 0) return null;

		const prob = event.chosen.probability;
		const topAlt = event.alternatives[0];
		const secondAlt = event.alternatives.length > 1 ? event.alternatives[1] : null;
		const spread = secondAlt ? topAlt.probability - secondAlt.probability : 1;

		if (level === 'kids') {
			if (prob > 0.7) {
				return {
					icon: '&#x1F60E;',
					text: `The AI was super confident here! "${event.chosen.token.trim()}" was the obvious choice — it had a really big slice of the wheel.`
				};
			}
			if (prob < 0.1) {
				return {
					icon: '&#x1F929;',
					text: `Surprise pick! The AI chose "${event.chosen.token.trim()}" even though it wasn't the most likely word. This is what makes AI writing interesting!`
				};
			}
			if (spread < 0.1 && event.alternatives.length > 2) {
				return {
					icon: '&#x1F914;',
					text: `The AI was really unsure here — lots of words seemed equally good! It's like being at an ice cream shop with too many flavors.`
				};
			}
			if (tokenCount > 0 && tokenCount % 10 === 0) {
				return getDidYouKnow();
			}
			return {
				icon: '&#x1F4AC;',
				text: `The AI picked "${event.chosen.token.trim()}" from ${event.alternatives.length} options. Click other words to see what else it considered!`
			};
		}

		if (level === 'curious') {
			if (prob > 0.8) {
				return {
					icon: '&#x1F3AF;',
					text: `Very high confidence (${(prob * 100).toFixed(0)}%). The model strongly predicted "${event.chosen.token.trim()}" — common in phrases where the next word is predictable (like "once upon a..." → "time").`
				};
			}
			if (prob < 0.1) {
				return {
					icon: '&#x26A1;',
					text: `Low probability token (${(prob * 100).toFixed(1)}%)! This is where temperature matters — higher temperature makes these unlikely picks more common, creating more creative text.`
				};
			}
			if (spread < 0.05 && event.alternatives.length > 2) {
				return {
					icon: '&#x1F4CA;',
					text: `Flat distribution — the top ${event.alternatives.length} candidates are close in probability. The model sees multiple valid continuations here. This is typical at choice points in text.`
				};
			}
			return null;
		}

		// Advanced
		if (event.chosen.logprob > -0.1) {
			return {
				icon: '&#x1F4CE;',
				text: `logprob ${event.chosen.logprob.toFixed(3)} → near-deterministic. Entropy is minimal here — the context strongly constrains the next token. Common in syntactic completions and fixed phrases.`
			};
		}
		if (event.chosen.logprob < -2.3) {
			return {
				icon: '&#x1F50D;',
				text: `logprob ${event.chosen.logprob.toFixed(3)} (p=${(prob * 100).toFixed(1)}%). This token was sampled from the tail of the distribution. Without temperature scaling, this choice would be much rarer.`
			};
		}
		return null;
	}

	function getMisconceptionBuster(): Insight | null {
		if (level !== 'kids' || !event) return null;

		// Trigger: AI produced a very coherent high-confidence sequence (5+ tokens >0.5 prob)
		// → "The AI doesn't understand meaning"
		if (tokenCount >= 10 && tokenCount % 15 === 0) {
			return {
				icon: '&#x1F4A1;',
				text: "Remember: the AI doesn't understand what these words mean! It learned which words usually go together by reading millions of texts — like a super-powered parrot. It's doing math, not thinking!"
			};
		}

		// Trigger: High confidence run (>0.7 for this token after 20+ tokens of narrative)
		// → "The AI doesn't plan ahead"
		if (event.chosen.probability > 0.7 && tokenCount > 20 && tokenCount % 20 === 0) {
			return {
				icon: '&#x1F6AB;',
				text: "This story seems like it was planned, but the AI has NO idea how it ends! It picks each word one at a time, only looking at what came before. Try generating again — you'll get a totally different story!"
			};
		}

		// Trigger: Every 25 tokens, remind about fact-checking
		if (tokenCount > 0 && tokenCount % 25 === 0) {
			return {
				icon: '&#x26A0;',
				text: "If the AI wrote something that sounds like a fact, be careful! The AI doesn't check if things are true — it just predicts what words usually follow other words. Always check facts with a real source!"
			};
		}

		return null;
	}

	function getDidYouKnow(): Insight {
		const facts = [
			{ icon: '&#x1F4DA;', text: "Did you know? This AI learned from reading billions of words — more text than any human could read in 10,000 lifetimes!" },
			{ icon: '&#x1F500;', text: "Try this: Run the same prompt again! You'll probably get a different story. The AI picks randomly each time, weighted by probability." },
			{ icon: '&#x1F321;', text: "Experiment: Move the creativity slider all the way to the ice cube, then try the flame. See how the words change?" },
			{ icon: '&#x1F9E9;', text: "Did you know? The AI doesn't understand meaning like you do. It's really good at predicting patterns, but it doesn't 'know' what the words mean!" },
			{ icon: '&#x1F30D;', text: "Fun fact: The AI sees words as 'tokens' — sometimes a single word, sometimes just part of one. 'Unbelievable' might be split into 'un' + 'believ' + 'able'!" },
			{ icon: '&#x1F916;', text: "The AI doesn't plan ahead. It picks one word at a time without knowing how the story will end. Each word only depends on what came before!" },
			{ icon: '&#x1F3B2;', text: "Think of it like this: the AI is playing a game where it rolls weighted dice to pick each word. Some words have heavier sides on the dice!" }
		];
		return facts[Math.floor(Math.random() * facts.length)];
	}
</script>

{#if insight}
	<div
		class="mt-3 rounded-lg border p-3"
		style="background: color-mix(in srgb, var(--pv-accent) 5%, var(--pv-bg)); border-color: color-mix(in srgb, var(--pv-accent) 20%, var(--pv-border))"
	>
		<p class="text-xs leading-relaxed" style="color: var(--pv-text-secondary)">
			<span>{@html insight.icon}</span>
			{insight.text}
		</p>
	</div>
{/if}

{#if misconception}
	<div
		class="mt-2 rounded-lg border p-3"
		style="background: color-mix(in srgb, var(--pv-warning) 8%, var(--pv-bg)); border-color: color-mix(in srgb, var(--pv-warning) 30%, var(--pv-border))"
	>
		<p class="text-xs leading-relaxed" style="color: var(--pv-text-secondary)">
			<span>{@html misconception.icon}</span>
			<strong style="color: var(--pv-warning)">Good to know:</strong>
			{misconception.text}
		</p>
	</div>
{/if}
