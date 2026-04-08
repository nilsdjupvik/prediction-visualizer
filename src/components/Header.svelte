<script lang="ts">
	import type { DifficultyLevel } from '$lib/types.js';

	let { level, onLevelChange }: { level: DifficultyLevel; onLevelChange: (l: DifficultyLevel) => void } = $props();

	const levels: { value: DifficultyLevel; label: string; emoji: string }[] = [
		{ value: 'kids', label: 'Kids', emoji: '🎨' },
		{ value: 'curious', label: 'Curious', emoji: '🔍' },
		{ value: 'advanced', label: 'Advanced', emoji: '🔬' }
	];
</script>

<header class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1
			class="text-3xl font-bold tracking-tight sm:text-4xl"
			style="font-family: var(--pv-font-display); color: var(--pv-text-primary)"
		>
			Prediction<span style="color: var(--pv-accent)">Visualizer</span>
		</h1>
		<p class="mt-2 max-w-md text-sm leading-relaxed" style="color: var(--pv-text-secondary)">
			Watch an AI think, one word at a time
		</p>
	</div>

	<nav class="flex gap-1 rounded-lg p-1" style="background: var(--pv-surface)" aria-label="Difficulty level">
		{#each levels as l}
			<button
				class="min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold transition-all"
				style="
					font-family: var(--pv-font-display);
					{level === l.value
						? 'background: var(--pv-accent); color: var(--pv-bg);'
						: 'color: var(--pv-text-secondary);'}
					transition-timing-function: var(--pv-ease-out);
					transition-duration: var(--pv-duration-fast);
				"
				onclick={() => onLevelChange(l.value)}
				aria-pressed={level === l.value}
			>
				{l.emoji} {l.label}
			</button>
		{/each}
	</nav>
</header>
