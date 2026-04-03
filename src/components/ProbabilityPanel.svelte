<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { TokenEvent, TokenCandidate, DifficultyLevel } from '$lib/types.js';
	import { probabilityColor, formatProbability } from '$lib/probability.js';
	import SpinWheel from './SpinWheel.svelte';

	let {
		event,
		level,
		temperature,
		topP = 0.9
	}: {
		event: TokenEvent;
		level: DifficultyLevel;
		temperature: number;
		topP?: number;
	} = $props();

	type AdjustedCandidate = TokenCandidate & { adjustedProbability: number };

	/** Re-compute probabilities at a given temperature using stored logprobs */
	function rescaleAtTemperature(alts: TokenCandidate[], temp: number): AdjustedCandidate[] {
		if (temp <= 0 || alts.length === 0) return alts.map((a) => ({ ...a, adjustedProbability: a.probability }));
		const scaledLogprobs = alts.map((a) => a.logprob / temp);
		const maxLogprob = Math.max(...scaledLogprobs);
		const exps = scaledLogprobs.map((lp) => Math.exp(lp - maxLogprob));
		const sum = exps.reduce((a, b) => a + b, 0);
		return alts.map((a, i) => ({
			...a,
			adjustedProbability: sum > 0 ? exps[i] / sum : a.probability
		}));
	}

	// The generation was run at some temperature, but we show a live preview
	// at the CURRENT slider temperature. If they match, no ghost bars needed.
	const adjustedAlts = $derived(rescaleAtTemperature(event.alternatives, temperature));
	const maxOrigProb = $derived(Math.max(...event.alternatives.map((a) => a.probability)));
	const maxAdjProb = $derived(Math.max(...adjustedAlts.map((a) => a.adjustedProbability)));
	const maxProb = $derived(Math.max(maxOrigProb, maxAdjProb));

	// Show temperature comparison when the slider has moved noticeably
	const showComparison = $derived(
		adjustedAlts.some((a, i) => Math.abs(a.adjustedProbability - event.alternatives[i].probability) > 0.02)
	);

	// Nucleus fence: find where cumulative probability crosses topP
	const nucleusFenceIndex = $derived(() => {
		let cumsum = 0;
		for (let i = 0; i < adjustedAlts.length; i++) {
			cumsum += adjustedAlts[i].adjustedProbability;
			if (cumsum >= topP) return i;
		}
		return adjustedAlts.length - 1;
	});
	const showNucleusFence = $derived(level !== 'kids' && adjustedAlts.length > 2);
</script>

<div
	class="rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
	transition:slide={{ duration: 200 }}
>
	<h3 class="mb-1 text-sm font-semibold" style="color: var(--pv-text-secondary)">
		{level === 'kids' ? 'What the AI was thinking...' : 'Token alternatives'}
	</h3>
	<p class="mb-3 text-xs" style="color: var(--pv-text-muted)">
		{#if showComparison}
			{level === 'kids'
				? 'Drag the creativity slider — watch the bars change!'
				: `Live preview at T=${temperature.toFixed(1)} (outlines = original)`}
		{:else}
			{level === 'kids'
				? 'Bigger slice = more likely to be picked!'
				: `Top ${event.alternatives.length} candidates (normalized probabilities)`}
		{/if}
	</p>

	<!-- Spin wheel for kids mode -->
	{#if level === 'kids' && !showComparison}
		<SpinWheel {event} />
	{/if}

	<!-- Bar chart (always for curious/advanced, fallback for kids in comparison mode) -->
	<div class="space-y-1.5" style={level === 'kids' && !showComparison ? 'display: none' : ''}>
		{#each adjustedAlts as alt, i}
			{@const isChosen = alt.token === event.chosen.token}
			{@const origProb = event.alternatives[i].probability}
			{@const adjProb = alt.adjustedProbability}
			{@const origBarWidth = maxProb > 0 ? (origProb / maxProb) * 100 : 0}
			{@const adjBarWidth = maxProb > 0 ? (adjProb / maxProb) * 100 : 0}
			{@const color = probabilityColor(adjProb)}
			{@const inNucleus = !showNucleusFence || i <= nucleusFenceIndex()}

			<div class="flex items-center gap-2" style="opacity: {inNucleus ? '1' : '0.4'}">
				<!-- Token label -->
				<span
					class="w-24 truncate text-right font-mono text-xs"
					style="color: {isChosen ? 'var(--pv-chosen-ring)' : 'var(--pv-text-primary)'}"
					title={alt.token}
				>
					{isChosen ? '>' : ''}{alt.token.trim() || '(space)'}
				</span>

				<!-- Bars container -->
				<div class="relative flex-1" style="height: 20px;">
					<!-- Ghost bar (original probability) — only if comparison active -->
					{#if showComparison}
						<div
							class="absolute top-0 left-0 h-full rounded-sm transition-all duration-300 ease-out"
							style="width: {origBarWidth}%; border: 1.5px dashed {isChosen ? 'var(--pv-chosen-ring)' : color}; opacity: 0.35; min-width: 2px;"
						></div>
					{/if}
					<!-- Adjusted bar (current temperature) -->
					<div
						class="absolute top-0 left-0 h-full rounded-sm transition-all duration-300 ease-out"
						style="width: {adjBarWidth}%; background: {isChosen ? 'var(--pv-chosen-ring)' : color}; min-width: 2px;"
					></div>
				</div>

				<!-- Probability -->
				{#if level !== 'kids'}
					<span class="w-12 text-right font-mono text-[10px]" style="color: var(--pv-text-muted)">
						{formatProbability(adjProb)}
					</span>
				{/if}

				<!-- Delta indicator when comparison is active -->
				{#if showComparison && level !== 'kids'}
					{@const delta = adjProb - origProb}
					<span
						class="w-10 text-right font-mono text-[9px]"
						style="color: {delta > 0 ? 'var(--pv-success)' : delta < 0 ? 'var(--pv-prob-low)' : 'var(--pv-text-muted)'}"
					>
						{delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}
					</span>
				{/if}

				<!-- Logprob (advanced only) -->
				{#if level === 'advanced' && !showComparison}
					<span class="w-16 text-right font-mono text-[10px]" style="color: var(--pv-text-muted)">
						{alt.logprob.toFixed(3)}
					</span>
				{/if}
			</div>

			<!-- Nucleus fence divider -->
			{#if showNucleusFence && i === nucleusFenceIndex() && i < adjustedAlts.length - 1}
				<div class="my-1 flex items-center gap-2">
					<span class="w-24"></span>
					<div class="flex-1 border-t border-dashed" style="border-color: var(--pv-warning)"></div>
					<span class="text-[9px] font-medium whitespace-nowrap" style="color: var(--pv-warning)">
						top-P={topP} keeps {i + 1}
					</span>
				</div>
			{/if}
		{/each}
	</div>

	{#if level === 'kids' && event.chosen.probability < 0.1}
		<p class="mt-3 rounded-lg p-2 text-center text-xs" style="background: var(--pv-bg); color: var(--pv-prob-low)">
			&#x2728; Surprise pick! The AI chose something unexpected!
		</p>
	{/if}

	{#if showComparison && level === 'kids'}
		<p class="mt-3 rounded-lg p-2 text-center text-xs" style="background: var(--pv-bg); color: var(--pv-accent)">
			&#x1F321; See how the bars change? More creativity = the smaller words get a bigger chance!
		</p>
	{/if}
</div>
