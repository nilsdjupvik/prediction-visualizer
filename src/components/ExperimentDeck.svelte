<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TokenEvent } from '$lib/types.js';

	let {
		tokens,
		prompt,
		onRerun,
		onSelectToken
	}: {
		tokens: TokenEvent[];
		prompt: string;
		onRerun: (temperature: number) => void;
		onSelectToken: (index: number) => void;
	} = $props();

	let dismissed = $state(false);

	// Find the most surprising token (lowest probability)
	const surpriseToken = $derived(() => {
		if (tokens.length === 0) return null;
		let min = tokens[0];
		for (const t of tokens) {
			if (t.chosen.probability < min.chosen.probability && t.alternatives.length > 0) {
				min = t;
			}
		}
		return min;
	});

	const experiments = $derived([
		{
			icon: '&#x1F525;',
			label: 'See it wild',
			description: 'Re-run at high creativity (T=1.8)',
			action: () => onRerun(1.8)
		},
		{
			icon: '&#x1F9CA;',
			label: 'See it safe',
			description: 'Re-run at low creativity (T=0.2)',
			action: () => onRerun(0.2)
		},
		...(surpriseToken()
			? [
					{
						icon: '&#x2728;',
						label: `Inspect "${surpriseToken()!.chosen.token.trim()}"`,
						description: 'Jump to the most surprising word',
						action: () => onSelectToken(surpriseToken()!.index)
					}
				]
			: [])
	]);
</script>

{#if !dismissed}
	<div class="mt-4 flex flex-wrap gap-2" transition:fly={{ y: 20, duration: 200 }}>
		<span class="self-center text-xs font-medium" style="color: var(--pv-text-muted)">
			Try this:
		</span>
		{#each experiments as exp}
			<button
				class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105"
				style="border-color: var(--pv-border); background: var(--pv-surface); color: var(--pv-text-primary)"
				onclick={exp.action}
				title={exp.description}
			>
				<span>{@html exp.icon}</span>
				{exp.label}
			</button>
		{/each}
		<button
			class="self-center text-[10px]"
			style="color: var(--pv-text-muted)"
			onclick={() => (dismissed = true)}
		>
			dismiss
		</button>
	</div>
{/if}
