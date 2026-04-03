<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TokenEvent } from '$lib/types.js';
	import { probabilityColor } from '$lib/probability.js';

	let {
		runA,
		runB,
		prompt
	}: {
		runA: TokenEvent[];
		runB: TokenEvent[];
		prompt: string;
	} = $props();

	// Compare tokens and find differences
	const maxLen = $derived(Math.max(runA.length, runB.length));
	const diffCount = $derived(() => {
		let count = 0;
		for (let i = 0; i < maxLen; i++) {
			const a = runA[i]?.chosen.token ?? '';
			const b = runB[i]?.chosen.token ?? '';
			if (a !== b) count++;
		}
		return count;
	});
</script>

<div
	class="mt-4 rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
	transition:fly={{ y: 10, duration: 200 }}
>
	<h3 class="mb-2 text-sm font-semibold" style="color: var(--pv-text-secondary)">
		&#x1F500; Run Comparison
	</h3>
	<p class="mb-3 text-xs" style="color: var(--pv-text-muted)">
		Same prompt, different results!
		<strong style="color: var(--pv-warning)">{diffCount()}</strong> of {maxLen} tokens differ.
	</p>

	<div class="grid grid-cols-2 gap-3">
		<!-- Run A -->
		<div>
			<div class="mb-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--pv-accent)">
				Run A
			</div>
			<div
				class="max-h-40 overflow-y-auto rounded-lg p-2"
				style="background: var(--pv-bg)"
			>
				<span class="font-mono text-[11px]" style="color: var(--pv-text-muted)">{prompt}</span>
				{#each runA as event, i}
					{@const differs = runB[i] && event.chosen.token !== runB[i].chosen.token}
					<span
						class="font-mono text-[11px]"
						style="color: var(--pv-text-primary); {differs ? `background: color-mix(in srgb, var(--pv-warning) 25%, transparent); border-radius: 2px;` : ''}"
					>{event.chosen.token}</span>
				{/each}
			</div>
		</div>

		<!-- Run B -->
		<div>
			<div class="mb-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--pv-success)">
				Run B
			</div>
			<div
				class="max-h-40 overflow-y-auto rounded-lg p-2"
				style="background: var(--pv-bg)"
			>
				<span class="font-mono text-[11px]" style="color: var(--pv-text-muted)">{prompt}</span>
				{#each runB as event, i}
					{@const differs = runA[i] && event.chosen.token !== runA[i].chosen.token}
					<span
						class="font-mono text-[11px]"
						style="color: var(--pv-text-primary); {differs ? `background: color-mix(in srgb, var(--pv-warning) 25%, transparent); border-radius: 2px;` : ''}"
					>{event.chosen.token}</span>
				{/each}
			</div>
		</div>
	</div>

	<p class="mt-3 text-center text-xs" style="color: var(--pv-text-muted)">
		&#x1F4A1; Highlighted words are different between the two runs. Same prompt, same settings — the AI just sampled differently!
	</p>
</div>
