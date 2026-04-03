<script lang="ts">
	import type { DifficultyLevel } from '$lib/types.js';

	let { level, onLevelChange }: { level: DifficultyLevel; onLevelChange: (l: DifficultyLevel) => void } = $props();

	const levels: { value: DifficultyLevel; label: string; emoji: string }[] = [
		{ value: 'kids', label: 'Kids', emoji: '🎨' },
		{ value: 'curious', label: 'Curious', emoji: '🔍' },
		{ value: 'advanced', label: 'Advanced', emoji: '🔬' }
	];
</script>

<header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<div>
		<h1 class="font-[family-name:var(--pv-font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
			Prediction Visualizer
		</h1>
		<p class="mt-1 text-sm" style="color: var(--pv-text-secondary)">
			Watch an AI think, one word at a time
		</p>
	</div>

	<div class="flex gap-1 rounded-lg p-1" style="background: var(--pv-surface)">
		{#each levels as l}
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
				style={level === l.value
					? `background: var(--pv-accent); color: white;`
					: `color: var(--pv-text-secondary);`}
				onclick={() => onLevelChange(l.value)}
				aria-pressed={level === l.value}
			>
				{l.emoji} {l.label}
			</button>
		{/each}
	</div>
</header>
