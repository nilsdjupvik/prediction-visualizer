<script lang="ts">
	let {
		onStartChallenge
	}: {
		onStartChallenge: (prompt: string, temperature: number) => void;
	} = $props();

	const challenges = [
		{
			icon: '&#x1F3AF;',
			title: 'Confidence Champion',
			description: 'Write a prompt that makes the AI super confident about every word. Aim for all blue tokens!',
			hint: 'Try common phrases like "The capital of France is" or "1, 2, 3, 4,"',
			suggestedPrompt: 'The capital of France is',
			temperature: 0.3,
			color: 'var(--pv-prob-high)'
		},
		{
			icon: '&#x2728;',
			title: 'Surprise Master',
			description: 'Try to get the AI to pick as many surprising (red/amber) words as possible!',
			hint: 'Crank up the creativity and use an unusual prompt',
			suggestedPrompt: 'The purple elephant quietly',
			temperature: 1.8,
			color: 'var(--pv-prob-low)'
		},
		{
			icon: '&#x1F500;',
			title: 'Copycat Test',
			description: 'Run the same prompt twice. How many words match? (Use the Compare button after!)',
			hint: 'The more predictable the prompt, the more words will match',
			suggestedPrompt: 'Once upon a time there was a',
			temperature: 0.8,
			color: 'var(--pv-warning)'
		},
		{
			icon: '&#x1F9CA;',
			title: 'Freeze Frame',
			description: 'Set creativity to minimum. Can you find a prompt where every single word is 100% predictable?',
			hint: 'Try finishing a well-known phrase or counting sequence',
			suggestedPrompt: '1 + 1 =',
			temperature: 0.1,
			color: 'var(--pv-accent)'
		}
	];

	let expandedIndex = $state<number | null>(null);
</script>

<div class="mb-8">
	<h3 class="mb-4 text-sm font-bold" style="color: var(--pv-text-primary); font-family: var(--pv-font-display)">
		Challenges — Can you control the AI?
	</h3>

	<div class="grid gap-3 sm:grid-cols-2">
		{#each challenges as challenge, i}
			<button
				class="rounded-xl p-4 text-left transition-all"
				style="
					background: {expandedIndex === i ? `color-mix(in srgb, ${challenge.color} 8%, var(--pv-surface))` : 'var(--pv-surface)'};
					border-left: 3px solid {expandedIndex === i ? challenge.color : 'transparent'};
					transition-timing-function: var(--pv-ease-out);
					transition-duration: var(--pv-duration-normal);
				"
				onclick={() => (expandedIndex = expandedIndex === i ? null : i)}
				aria-expanded={expandedIndex === i}
			>
				<div class="flex items-center gap-2">
					<span class="text-lg">{@html challenge.icon}</span>
					<span class="text-sm font-semibold" style="color: var(--pv-text-primary); font-family: var(--pv-font-display)">{challenge.title}</span>
				</div>
				<p class="mt-1.5 text-xs leading-relaxed" style="color: var(--pv-text-muted)">{challenge.description}</p>

				{#if expandedIndex === i}
					<div class="mt-3 space-y-2">
						<p class="text-[10px] italic" style="color: var(--pv-text-secondary)">
							Hint: {challenge.hint}
						</p>
						<button
							class="w-full min-h-[40px] rounded-lg px-3 py-2 text-xs font-semibold transition-all"
							style="
								background: {challenge.color};
								color: var(--pv-bg);
								font-family: var(--pv-font-display);
								transition-timing-function: var(--pv-ease-out);
							"
							onclick={(e: MouseEvent) => { e.stopPropagation(); onStartChallenge(challenge.suggestedPrompt, challenge.temperature); }}
						>
							Try it! ({challenge.suggestedPrompt})
						</button>
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>
