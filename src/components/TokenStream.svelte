<script lang="ts">
	import type { TokenEvent, DifficultyLevel } from '$lib/types.js';
	import TokenChip from './TokenChip.svelte';

	let {
		prompt,
		tokens,
		selectedTokenIndex,
		level,
		onTokenSelect
	}: {
		prompt: string;
		tokens: TokenEvent[];
		selectedTokenIndex: number | null;
		level: DifficultyLevel;
		onTokenSelect: (index: number) => void;
	} = $props();

	let streamEl: HTMLDivElement | undefined = $state();

	const hasThinking = $derived(tokens.some((t) => t.isThinking));
	const thinkingTokens = $derived(tokens.filter((t) => t.isThinking));
	const responseTokens = $derived(tokens.filter((t) => !t.isThinking));
	let thinkingCollapsed = $state(false);

	// Auto-scroll to bottom as tokens arrive
	$effect(() => {
		if (tokens.length && streamEl) {
			streamEl.scrollTop = streamEl.scrollHeight;
		}
	});
</script>

<div
	bind:this={streamEl}
	class="max-h-80 overflow-y-auto rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
	role="log"
	aria-label="Generated text"
	aria-live="polite"
>
	<!-- Thinking section -->
	{#if hasThinking && thinkingTokens.length > 0}
		<div
			class="mb-3 rounded-lg border p-3"
			style="background: color-mix(in srgb, var(--pv-accent) 5%, var(--pv-bg)); border-color: color-mix(in srgb, var(--pv-accent) 30%, var(--pv-border))"
		>
			<button
				class="mb-2 flex w-full items-center gap-2 text-left text-xs font-semibold"
				style="color: var(--pv-accent)"
				onclick={() => (thinkingCollapsed = !thinkingCollapsed)}
			>
				<span class="transition-transform" style="transform: rotate({thinkingCollapsed ? '0' : '90'}deg)">&#x25B6;</span>
				&#x1F9E0; Thinking ({thinkingTokens.length} tokens)
			</button>
			{#if !thinkingCollapsed}
				<span class="inline">
					{#each thinkingTokens as event (event.index)}
						<TokenChip
							{event}
							selected={selectedTokenIndex === event.index}
							{level}
							onclick={() => onTokenSelect(event.index)}
						/>
					{/each}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Prompt shown dimmed -->
	{#if hasThinking && responseTokens.length > 0}
		<div class="mb-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--pv-text-muted)">
			Response
		</div>
	{/if}
	<span class="font-mono text-sm" style="color: var(--pv-text-muted)">{prompt}</span>

	<!-- Response tokens -->
	<span class="inline">
		{#each (hasThinking ? responseTokens : tokens) as event (event.index)}
			<TokenChip
				{event}
				selected={selectedTokenIndex === event.index}
				{level}
				onclick={() => onTokenSelect(event.index)}
			/>
		{/each}
	</span>
</div>
