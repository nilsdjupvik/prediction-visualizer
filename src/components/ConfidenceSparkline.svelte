<script lang="ts">
	import type { TokenEvent } from '$lib/types.js';

	let {
		tokens,
		selectedTokenIndex,
		onTokenSelect
	}: {
		tokens: TokenEvent[];
		selectedTokenIndex: number | null;
		onTokenSelect: (index: number) => void;
	} = $props();

	const width = 600;
	const height = 32;
	const padding = { top: 2, bottom: 2, left: 0, right: 0 };
	const plotW = width - padding.left - padding.right;
	const plotH = height - padding.top - padding.bottom;

	const points = $derived(
		tokens.map((t, i) => ({
			x: padding.left + (tokens.length > 1 ? (i / (tokens.length - 1)) * plotW : plotW / 2),
			y: padding.top + plotH - t.chosen.probability * plotH,
			prob: t.chosen.probability,
			index: i
		}))
	);

	const polyline = $derived(points.map((p) => `${p.x},${p.y}`).join(' '));
	const areaPath = $derived(
		points.length > 0
			? `M${padding.left},${padding.top + plotH} ` +
				points.map((p) => `L${p.x},${p.y}`).join(' ') +
				` L${points[points.length - 1].x},${padding.top + plotH} Z`
			: ''
	);

	/** Color interpolation: teal (confident) → orange (uncertain) */
	function probColor(prob: number): string {
		if (prob > 0.5) return '#2dd4bf'; // teal
		if (prob > 0.2) return '#f5a623'; // amber
		return '#e05c7a'; // rose
	}

	let hoveredIndex = $state<number | null>(null);

	function handleClick(index: number) {
		onTokenSelect(index);
	}
</script>

{#if tokens.length > 1}
	<div class="mb-2" aria-hidden="true">
		<svg
			viewBox="0 0 {width} {height}"
			class="w-full"
			style="height: {height}px; cursor: pointer;"
			role="img"
		>
			<!-- Gradient fill under the line -->
			<defs>
				<linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--pv-accent)" stop-opacity="0.3" />
					<stop offset="100%" stop-color="var(--pv-accent)" stop-opacity="0.05" />
				</linearGradient>
			</defs>

			<!-- Area fill -->
			{#if areaPath}
				<path d={areaPath} fill="url(#sparkline-grad)" />
			{/if}

			<!-- Line -->
			<polyline
				points={polyline}
				fill="none"
				stroke="var(--pv-accent)"
				stroke-width="1.5"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>

			<!-- Clickable hit areas + dots -->
			{#each points as p}
				{@const isSelected = selectedTokenIndex === p.index}
				{@const isHovered = hoveredIndex === p.index}
				<!-- Invisible wider hit area -->
				<rect
					x={p.x - (plotW / tokens.length / 2)}
					y="0"
					width={plotW / tokens.length}
					height={height}
					fill="transparent"
					role="button"
					tabindex="-1"
					onclick={() => handleClick(p.index)}
					onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleClick(p.index); }}
					onmouseenter={() => (hoveredIndex = p.index)}
					onmouseleave={() => (hoveredIndex = null)}
				/>
				<!-- Dot on hover/select -->
				{#if isSelected || isHovered}
					<circle
						cx={p.x}
						cy={p.y}
						r={isSelected ? 4 : 3}
						fill={isSelected ? 'var(--pv-chosen-ring)' : probColor(p.prob)}
						stroke="var(--pv-bg)"
						stroke-width="1"
					/>
				{/if}
			{/each}

			<!-- Selected token indicator line -->
			{#if selectedTokenIndex !== null && points[selectedTokenIndex]}
				<line
					x1={points[selectedTokenIndex].x}
					y1="0"
					x2={points[selectedTokenIndex].x}
					y2={height}
					stroke="var(--pv-chosen-ring)"
					stroke-width="1"
					stroke-dasharray="2,2"
					opacity="0.5"
				/>
			{/if}
		</svg>

		<!-- Labels -->
		<div class="flex justify-between text-[9px]" style="color: var(--pv-text-muted)">
			<span>Confidence per token</span>
			{#if hoveredIndex !== null && tokens[hoveredIndex]}
				<span>
					"{tokens[hoveredIndex].chosen.token.trim()}" — {(tokens[hoveredIndex].chosen.probability * 100).toFixed(0)}%
				</span>
			{:else}
				<span>Click to inspect</span>
			{/if}
		</div>
	</div>
{/if}
