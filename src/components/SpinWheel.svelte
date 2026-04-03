<script lang="ts">
	import type { TokenEvent } from '$lib/types.js';
	import { probabilityColor } from '$lib/probability.js';

	let {
		event
	}: {
		event: TokenEvent;
	} = $props();

	const size = 220;
	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 - 10;

	// Build pie slices from alternatives
	const slices = $derived(() => {
		const alts = event.alternatives.slice(0, 8); // limit to 8 slices
		let startAngle = 0;
		return alts.map((alt) => {
			const angle = alt.probability * Math.PI * 2;
			const slice = {
				token: alt.token.trim() || ' ',
				probability: alt.probability,
				startAngle,
				endAngle: startAngle + angle,
				midAngle: startAngle + angle / 2,
				color: probabilityColor(alt.probability),
				isChosen: alt.token === event.chosen.token
			};
			startAngle += angle;
			return slice;
		});
	});

	function arcPath(startAngle: number, endAngle: number, r: number): string {
		const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
		const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
		const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
		const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);
		const large = endAngle - startAngle > Math.PI ? 1 : 0;
		return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
	}

	function labelPos(midAngle: number, r: number): { x: number; y: number } {
		return {
			x: cx + r * 0.65 * Math.cos(midAngle - Math.PI / 2),
			y: cy + r * 0.65 * Math.sin(midAngle - Math.PI / 2)
		};
	}
</script>

<div class="flex flex-col items-center">
	<svg viewBox="0 0 {size} {size}" width={size} height={size}>
		<!-- Slices -->
		{#each slices() as slice}
			<path
				d={arcPath(slice.startAngle, slice.endAngle, radius)}
				fill={slice.isChosen
					? 'var(--pv-chosen-ring)'
					: `color-mix(in srgb, ${slice.color} 60%, var(--pv-surface))`}
				stroke="var(--pv-bg)"
				stroke-width="2"
			/>
			<!-- Label (only if slice is big enough) -->
			{#if slice.probability > 0.05}
				{@const pos = labelPos(slice.midAngle, radius)}
				<text
					x={pos.x}
					y={pos.y}
					text-anchor="middle"
					dominant-baseline="central"
					fill={slice.isChosen ? 'var(--pv-bg)' : 'var(--pv-text-primary)'}
					font-size={slice.probability > 0.15 ? '11' : '9'}
					font-family="var(--pv-font-mono)"
					font-weight={slice.isChosen ? '700' : '400'}
				>
					{slice.token.length > 8 ? slice.token.slice(0, 7) + '...' : slice.token}
				</text>
			{/if}
		{/each}

		<!-- Center dot -->
		<circle cx={cx} cy={cy} r="6" fill="var(--pv-bg)" stroke="var(--pv-border)" stroke-width="2" />

		<!-- Pointer/arrow at top -->
		<polygon
			points="{cx - 6},{8} {cx + 6},{8} {cx},{20}"
			fill="var(--pv-error)"
			stroke="var(--pv-bg)"
			stroke-width="1"
		/>
	</svg>

	<!-- Legend: chosen token -->
	<p class="mt-1 text-center text-xs" style="color: var(--pv-text-muted)">
		&#x1F3AF; Landed on: <strong style="color: var(--pv-chosen-ring)">{event.chosen.token.trim()}</strong>
	</p>
</div>
