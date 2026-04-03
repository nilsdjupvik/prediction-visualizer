<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TokenEvent, DifficultyLevel } from '$lib/types.js';
	import { probabilityColor, formatProbability, confidenceLabel } from '$lib/probability.js';

	let {
		event,
		selected = false,
		level,
		onclick
	}: {
		event: TokenEvent;
		selected?: boolean;
		level: DifficultyLevel;
		onclick: () => void;
	} = $props();

	const prob = $derived(event.chosen.probability);
	const color = $derived(event.isThinking ? 'var(--pv-accent)' : probabilityColor(prob));
	const isRare = $derived(prob < 0.1);
	let hovered = $state(false);

	// Runner-up: second-best alternative (first that isn't the chosen token)
	const runnerUp = $derived(
		event.alternatives.find((a) => a.token !== event.chosen.token) ?? null
	);
</script>

<span class="relative inline-flex items-center">
	<button
		class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1"
		style="
			background: {event.isThinking
				? 'color-mix(in srgb, var(--pv-accent) 10%, var(--pv-bg))'
				: `color-mix(in srgb, ${color} 25%, var(--pv-bg))`};
			border: 1.5px solid {selected ? 'var(--pv-chosen-ring)' : color};
			color: {event.isThinking ? 'var(--pv-text-secondary)' : 'var(--pv-text-primary)'};
			font-style: {event.isThinking ? 'italic' : 'normal'};
			focus-ring-color: var(--pv-accent);
		"
		title={event.isThinking
			? `Thinking: ${formatProbability(prob)}`
			: `${formatProbability(prob)} — ${confidenceLabel(prob)}`}
		aria-label={event.isThinking
			? `Thinking token '${event.chosen.token.trim()}'`
			: `Token '${event.chosen.token.trim()}', ${formatProbability(prob)} probability. ${confidenceLabel(prob)}`}
		{onclick}
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
		transition:fly={{ y: 8, duration: 200 }}
	>
		<span class="whitespace-pre">{event.chosen.token}</span>
		{#if level !== 'kids'}
			<span
				class="ml-1 text-[10px]"
				style="color: {color}"
			>
				{formatProbability(prob)}
			</span>
		{/if}
		{#if isRare && level === 'kids' && !event.isThinking}
			<span class="ml-0.5 text-xs">&#x2728;</span>
		{/if}
	</button>
	<!-- Ghost chip: runner-up on hover -->
	{#if hovered && runnerUp && !event.isThinking}
		<span
			class="pointer-events-none absolute top-full left-0 z-10 mt-0.5 inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-xs"
			style="
				border: 1.5px dashed {probabilityColor(runnerUp.probability)};
				color: var(--pv-text-muted);
				background: color-mix(in srgb, var(--pv-surface) 90%, transparent);
			"
			aria-hidden="true"
		>
			or {runnerUp.token.trim() || '(space)'}
			{#if level !== 'kids'}
				<span class="ml-1 text-[9px]" style="color: var(--pv-text-muted)">{formatProbability(runnerUp.probability)}</span>
			{/if}
		</span>
	{/if}
</span>
