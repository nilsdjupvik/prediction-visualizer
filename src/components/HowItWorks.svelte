<script lang="ts">
	import type { DifficultyLevel } from '$lib/types.js';

	let { level }: { level: DifficultyLevel } = $props();
	let expanded = $state(false);
</script>

<div
	class="mb-6 rounded-xl border"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
>
	<button
		class="flex w-full items-center justify-between p-4 text-left"
		onclick={() => (expanded = !expanded)}
	>
		<span class="flex items-center gap-2 text-sm font-semibold" style="color: var(--pv-text-primary)">
			&#x2753; How does AI write text?
		</span>
		<span
			class="text-xs transition-transform"
			style="color: var(--pv-text-muted); transform: rotate({expanded ? '180' : '0'}deg)"
		>&#x25BC;</span>
	</button>

	{#if expanded}
		<div class="border-t px-4 pb-4 pt-3" style="border-color: var(--pv-border)">
			{#if level === 'kids'}
				<div class="space-y-4 text-sm leading-relaxed" style="color: var(--pv-text-secondary)">
					<div class="flex gap-3">
						<span class="text-2xl">&#x1F4DA;</span>
						<div>
							<strong style="color: var(--pv-text-primary)">Step 1: The AI has read a LOT</strong>
							<p class="mt-1">Imagine someone who has read millions of books, websites, and conversations. That's what the AI has done! It learned patterns about which words usually follow other words.</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="text-2xl">&#x1F3B0;</span>
						<div>
							<strong style="color: var(--pv-text-primary)">Step 2: It picks the next word</strong>
							<p class="mt-1">When you type something, the AI looks at your words and thinks: "What word would most likely come next?" It doesn't pick just one — it considers MANY possible words, each with a different chance of being chosen. Like spinning a wheel where bigger slices have a better chance!</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="text-2xl">&#x1F504;</span>
						<div>
							<strong style="color: var(--pv-text-primary)">Step 3: Repeat, repeat, repeat</strong>
							<p class="mt-1">After picking one word, the AI looks at everything so far (your prompt + the new word) and picks the NEXT word. One at a time. That's how whole sentences and stories are built!</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="text-2xl">&#x1F3A8;</span>
						<div>
							<strong style="color: var(--pv-text-primary)">Step 4: You control the creativity!</strong>
							<p class="mt-1">The "How creative?" slider changes how the AI picks words. Low creativity = always picks the most likely word (boring but safe). High creativity = sometimes picks surprising words (fun but unpredictable)!</p>
						</div>
					</div>
					<div
						class="mt-3 rounded-lg p-3 text-center text-xs"
						style="background: var(--pv-bg); color: var(--pv-accent)"
					>
						&#x1F4A1; Try it! Type a sentence, press Generate, and watch the AI pick words one by one. Click on any word to see what other words it was considering!
					</div>
				</div>
			{:else if level === 'curious'}
				<div class="space-y-3 text-sm leading-relaxed" style="color: var(--pv-text-secondary)">
					<p>
						<strong style="color: var(--pv-text-primary)">Language models predict one token at a time.</strong>
						A "token" is usually a word or part of a word (like "un" + "believ" + "able"). For each position, the model calculates a probability distribution over all possible next tokens — thousands of candidates!
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Probability distribution:</strong>
						The model assigns a probability to every token in its vocabulary. "The" might get 35%, "a" gets 20%, "this" gets 8%, and so on. The probabilities always add up to 100%. This app shows you the top candidates for each position.
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Sampling:</strong>
						The model doesn't always pick the highest-probability token. Instead, it <em>samples</em> from the distribution — randomly choosing based on the probabilities. Temperature controls how much randomness: low temperature concentrates probability on the top choices, high temperature spreads it more evenly.
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Top-K and Top-P:</strong>
						These limit which tokens are eligible. Top-K only considers the K most likely tokens. Top-P (nucleus sampling) only considers tokens whose cumulative probability reaches P. Both prevent the model from picking extremely unlikely tokens.
					</p>
					<div
						class="mt-2 rounded-lg p-3 text-xs"
						style="background: var(--pv-bg); color: var(--pv-accent)"
					>
						&#x1F52C; Experiment: Try the same prompt twice with the same settings. You'll likely get different outputs! That's the randomness of sampling at work. Then try temperature 0.1 vs 2.0 to see the difference.
					</div>
				</div>
			{:else}
				<div class="space-y-3 text-sm leading-relaxed" style="color: var(--pv-text-secondary)">
					<p>
						<strong style="color: var(--pv-text-primary)">Autoregressive generation with logprobs.</strong>
						This app streams token generation from a local Ollama model and displays the log-probability distribution at each step. Each token shows the top-N candidates from the model's softmax output layer.
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Log probabilities:</strong>
						The raw values are natural log probabilities (logprobs). A logprob of 0 means 100% confidence; -0.7 means ~50%; -2.3 means ~10%; -4.6 means ~1%. Convert with <code style="color: var(--pv-accent); font-family: var(--pv-font-mono); font-size: 0.85em">Math.exp(logprob)</code>. The probabilities shown in the bar chart are normalized across only the top-N visible candidates, not the full vocabulary.
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Temperature scaling:</strong>
						Before sampling, logits are divided by the temperature value. T=1.0 is unmodified, T&lt;1 sharpens the distribution (less entropy), T&gt;1 flattens it (more entropy). At T=0, generation becomes greedy (argmax).
					</p>
					<p>
						<strong style="color: var(--pv-text-primary)">Raw mode:</strong>
						When thinking is OFF, prompts are sent with <code style="color: var(--pv-accent); font-family: var(--pv-font-mono); font-size: 0.85em">raw: true</code> — no chat template wrapping. This gives pure text completion. When thinking is ON, the chat template is applied so the model can use its chain-of-thought format.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
