<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TokenEvent } from '$lib/types.js';
	import { probabilityColor, formatProbability } from '$lib/probability.js';

	let {
		pendingEvent,
		onChoose,
		onLetAIPick,
		choiceCount
	}: {
		pendingEvent: TokenEvent;
		onChoose: (tokenIndex: number) => void;
		onLetAIPick: () => void;
		choiceCount: number;
	} = $props();

	const topChoices = $derived(pendingEvent.alternatives.slice(0, 4));
</script>

<div
	class="rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-chosen-ring)"
	transition:fly={{ y: 10, duration: 200 }}
>
	<div class="mb-1 flex items-center justify-between">
		<h3 class="text-sm font-bold" style="color: var(--pv-chosen-ring)">
			&#x1F500; Your turn!
		</h3>
		<span class="text-[10px]" style="color: var(--pv-text-muted)">
			Choice #{choiceCount + 1}
		</span>
	</div>
	<p class="mb-3 text-xs" style="color: var(--pv-text-secondary)">
		The AI is unsure — pick which word continues the story!
	</p>

	<div class="space-y-2">
		{#each topChoices as alt, i}
			{@const color = probabilityColor(alt.probability)}
			<button
				class="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02]"
				style="border-color: {color}; background: color-mix(in srgb, {color} 10%, var(--pv-bg))"
				onclick={() => onChoose(i)}
			>
				<span class="font-mono text-sm font-medium" style="color: var(--pv-text-primary)">
					{alt.token.trim() || '(space)'}
				</span>
				<span class="flex-1"></span>
				<!-- Probability bar mini -->
				<div class="h-2 w-16 rounded-full" style="background: var(--pv-bg)">
					<div
						class="h-full rounded-full"
						style="width: {alt.probability * 100}%; background: {color}; min-width: 4px"
					></div>
				</div>
				<span class="text-[10px] font-mono" style="color: var(--pv-text-muted)">
					{formatProbability(alt.probability)}
				</span>
			</button>
		{/each}
	</div>

	<button
		class="mt-3 w-full rounded-lg px-3 py-1.5 text-xs transition-colors"
		style="color: var(--pv-text-muted); background: var(--pv-bg)"
		onclick={onLetAIPick}
	>
		Let the AI pick
	</button>
</div>
