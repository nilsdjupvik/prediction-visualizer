<script lang="ts">
	import type { GenerationParameters, DifficultyLevel } from '$lib/types.js';

	let {
		parameters = $bindable(),
		level
	}: {
		parameters: GenerationParameters;
		level: DifficultyLevel;
	} = $props();

	let openTooltip = $state<string | null>(null);

	function toggleTooltip(id: string) {
		openTooltip = openTooltip === id ? null : id;
	}

	function temperatureLabel(t: number): string {
		if (t <= 0.3) return 'Very predictable';
		if (t <= 0.6) return 'Predictable';
		if (t <= 1.0) return 'Balanced';
		if (t <= 1.5) return 'Creative';
		return 'Wild!';
	}

	const temperatureGradient = 'linear-gradient(to right, #4b9eff, #f5a623, #e05c7a)';

	const tooltips: Record<string, Record<DifficultyLevel, string>> = {
		temperature: {
			kids: "This controls how surprising the AI's word choices are. Ice cube = always picks the most expected word. Fire = picks more surprising, unusual words. Try both and see what happens!",
			curious: "Temperature scales the probability distribution before sampling. Low values (0.1-0.5) make the model more focused on high-probability tokens. High values (1.5-2.0) flatten the distribution, giving rare tokens a better chance of being selected.",
			advanced: "Divides raw logits by T before softmax. T→0 = argmax (greedy decoding). T=1.0 = unmodified distribution. T>1 = higher entropy, more uniform sampling. Mathematically: P(token) = exp(logit/T) / Σexp(logits/T)."
		},
		topK: {
			kids: "Imagine the AI has a big list of words it could pick. This slider says: 'Only look at the top 5... or top 50... words.' Fewer words = more predictable. More words = more variety!",
			curious: "Top-K limits sampling to the K most probable tokens. With K=5, only the 5 most likely tokens are considered, regardless of their actual probabilities. Lower K = more constrained output. Higher K = more diverse but potentially less coherent.",
			advanced: "After computing logits, only the top K tokens by logit value are retained; the rest are masked to -inf before softmax. This is a hard cutoff — unlike top-P, it doesn't adapt to the shape of the distribution."
		},
		topP: {
			kids: "This is another way to control variety — but smarter than the words slider!",
			curious: "Top-P (nucleus sampling) keeps the smallest set of tokens whose cumulative probability exceeds P. Unlike top-K, it adapts to the distribution shape: when the model is confident, fewer tokens are considered; when uncertain, more tokens are included.",
			advanced: "Nucleus sampling (Holtzman et al., 2020). Sorts tokens by probability, takes the minimal set where Σp ≥ P. Applied after temperature scaling, before top-K. P=0.9 is a common default — it trims the long tail while being more adaptive than a fixed K cutoff."
		},
		maxTokens: {
			kids: "How long should the AI's text be? A small number = short answer. A big number = long story!",
			curious: "Maximum number of tokens the model will generate. One token is roughly 3/4 of a word in English. 100 tokens ≈ 75 words. Generation also stops if the model produces an end-of-sequence token.",
			advanced: "Sets num_predict in the Ollama API. Generation terminates at min(num_predict, model's max context). Also stops on EOS token. Note: with raw mode, there's no system prompt consuming context — the full context window is available for prompt + completion."
		},
		repeatPenalty: {
			kids: "This stops the AI from saying the same thing over and over. Higher = less repetition. Like telling someone 'use different words!'",
			curious: "Repeat penalty discourages the model from reusing tokens it has already generated. A value of 1.0 means no penalty. Higher values (1.1-1.5) make repetition less likely. Too high and the output becomes incoherent.",
			advanced: "Multiplies the logits of previously generated tokens by 1/repeat_penalty (for positive logits) or repeat_penalty (for negative logits). Applied to the last repeat_last_n tokens. Default 1.1. Values >1.5 can cause degenerate output."
		}
	};
</script>

<div
	class="mb-6 rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
>
	<div class="flex flex-wrap gap-6">
		<!-- Temperature (always shown) -->
		<div class="min-w-48 flex-1">
			<div class="mb-1 flex items-center justify-between">
				<div class="flex items-center gap-1.5">
					<label for="temperature" class="text-sm font-medium" style="color: var(--pv-text-secondary)">
						{level === 'kids' ? 'How creative?' : 'Temperature'}
					</label>
					<button
						class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
						style="background: var(--pv-bg); color: var(--pv-text-muted); border: 1px solid var(--pv-border)"
						onclick={() => toggleTooltip('temperature')}
						aria-label="What is temperature?"
					>?</button>
				</div>
				<span class="text-xs" style="color: var(--pv-text-muted)">
					{level === 'kids' ? temperatureLabel(parameters.temperature) : parameters.temperature.toFixed(1)}
				</span>
			</div>
			{#if openTooltip === 'temperature'}
				<div class="mb-2 rounded-lg p-2.5 text-xs leading-relaxed" style="background: var(--pv-bg); color: var(--pv-text-secondary); border: 1px solid var(--pv-border)">
					{tooltips.temperature[level]}
				</div>
			{/if}
			<div class="flex items-center gap-2">
				<span class="text-base" title="Predictable">&#x1F9CA;</span>
				<input
					id="temperature"
					type="range"
					min="0.1"
					max="2.0"
					step="0.1"
					bind:value={parameters.temperature}
					class="flex-1 accent-[var(--pv-accent)]"
					style="--track-bg: {temperatureGradient}"
					aria-label="Creativity level, from predictable to wild"
				/>
				<span class="text-base" title="Wild">&#x1F525;</span>
			</div>
		</div>

		<!-- Top-K (always shown) -->
		<div class="min-w-48 flex-1">
			<div class="mb-1 flex items-center justify-between">
				<div class="flex items-center gap-1.5">
					<label for="topk" class="text-sm font-medium" style="color: var(--pv-text-secondary)">
						{level === 'kids' ? 'Words to consider' : 'Top-K'}
					</label>
					<button
						class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
						style="background: var(--pv-bg); color: var(--pv-text-muted); border: 1px solid var(--pv-border)"
						onclick={() => toggleTooltip('topK')}
						aria-label="What is top-K?"
					>?</button>
				</div>
				<span class="text-xs" style="color: var(--pv-text-muted)">{parameters.topK}</span>
			</div>
			{#if openTooltip === 'topK'}
				<div class="mb-2 rounded-lg p-2.5 text-xs leading-relaxed" style="background: var(--pv-bg); color: var(--pv-text-secondary); border: 1px solid var(--pv-border)">
					{tooltips.topK[level]}
				</div>
			{/if}
			<input
				id="topk"
				type="range"
				min="5"
				max="100"
				step="5"
				bind:value={parameters.topK}
				class="w-full accent-[var(--pv-accent)]"
				aria-label="How many words the AI considers each step"
			/>
		</div>

		<!-- Top-P (curious + advanced only) -->
		{#if level !== 'kids'}
			<div class="min-w-48 flex-1">
				<div class="mb-1 flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<label for="topp" class="text-sm font-medium" style="color: var(--pv-text-secondary)">
							{level === 'curious' ? 'Variety' : 'Top-P (nucleus)'}
						</label>
						<button
							class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
							style="background: var(--pv-bg); color: var(--pv-text-muted); border: 1px solid var(--pv-border)"
							onclick={() => toggleTooltip('topP')}
							aria-label="What is top-P?"
						>?</button>
					</div>
					<span class="text-xs" style="color: var(--pv-text-muted)">{parameters.topP.toFixed(1)}</span>
				</div>
				{#if openTooltip === 'topP'}
					<div class="mb-2 rounded-lg p-2.5 text-xs leading-relaxed" style="background: var(--pv-bg); color: var(--pv-text-secondary); border: 1px solid var(--pv-border)">
						{tooltips.topP[level]}
					</div>
				{/if}
				<input
					id="topp"
					type="range"
					min="0.1"
					max="1.0"
					step="0.05"
					bind:value={parameters.topP}
					class="w-full accent-[var(--pv-accent)]"
					aria-label="Probability cutoff for word selection"
				/>
			</div>
		{/if}

		<!-- Max tokens (curious + advanced) -->
		{#if level !== 'kids'}
			<div class="min-w-48 flex-1">
				<div class="mb-1 flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<label for="numpredict" class="text-sm font-medium" style="color: var(--pv-text-secondary)">
							Max words
						</label>
						<button
							class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
							style="background: var(--pv-bg); color: var(--pv-text-muted); border: 1px solid var(--pv-border)"
							onclick={() => toggleTooltip('maxTokens')}
							aria-label="What is max tokens?"
						>?</button>
					</div>
					<span class="text-xs" style="color: var(--pv-text-muted)">{parameters.numPredict}</span>
				</div>
				{#if openTooltip === 'maxTokens'}
					<div class="mb-2 rounded-lg p-2.5 text-xs leading-relaxed" style="background: var(--pv-bg); color: var(--pv-text-secondary); border: 1px solid var(--pv-border)">
						{tooltips.maxTokens[level]}
					</div>
				{/if}
				<input
					id="numpredict"
					type="range"
					min="10"
					max="500"
					step="10"
					bind:value={parameters.numPredict}
					class="w-full accent-[var(--pv-accent)]"
					aria-label="Maximum number of words to generate"
				/>
			</div>
		{/if}

		<!-- Repeat penalty (always shown) -->
		<div class="min-w-48 flex-1">
			<div class="mb-1 flex items-center justify-between">
				<div class="flex items-center gap-1.5">
					<label for="repeatpenalty" class="text-sm font-medium" style="color: var(--pv-text-secondary)">
						{level === 'kids' ? 'Stop repeating' : 'Repeat penalty'}
					</label>
					<button
						class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
						style="background: var(--pv-bg); color: var(--pv-text-muted); border: 1px solid var(--pv-border)"
						onclick={() => toggleTooltip('repeatPenalty')}
						aria-label="What is repeat penalty?"
					>?</button>
				</div>
				<span class="text-xs" style="color: var(--pv-text-muted)">
					{level === 'kids' ? (parameters.repeatPenalty <= 1.0 ? 'Off' : parameters.repeatPenalty <= 1.1 ? 'Normal' : 'Strong') : parameters.repeatPenalty.toFixed(1)}
				</span>
			</div>
			{#if openTooltip === 'repeatPenalty'}
				<div class="mb-2 rounded-lg p-2.5 text-xs leading-relaxed" style="background: var(--pv-bg); color: var(--pv-text-secondary); border: 1px solid var(--pv-border)">
					{tooltips.repeatPenalty[level]}
				</div>
			{/if}
			<div class="flex items-center gap-2">
				<span class="text-base" title="Allow repeats">&#x1F503;</span>
				<input
					id="repeatpenalty"
					type="range"
					min="1.0"
					max="2.0"
					step="0.1"
					bind:value={parameters.repeatPenalty}
					class="flex-1 accent-[var(--pv-accent)]"
					aria-label="How much to penalize repeated words"
				/>
				<span class="text-base" title="No repeats">&#x1F6AB;</span>
			</div>
		</div>
	</div>
</div>
