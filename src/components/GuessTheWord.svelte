<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TokenEvent } from '$lib/types.js';
	import { formatProbability } from '$lib/probability.js';

	let {
		pendingEvent,
		onGuess,
		onSkip,
		streak,
		score,
		totalRevealed
	}: {
		pendingEvent: TokenEvent;
		onGuess: (guess: string) => void;
		onSkip: () => void;
		streak: number;
		score: number;
		totalRevealed: number;
	} = $props();

	let guess = $state('');
	let result = $state<null | 'exact' | 'close' | 'miss'>(null);
	let resultMessage = $state('');
	let showingResult = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!guess.trim()) return;
		submitGuess(guess.trim().toLowerCase());
	}

	function handleChoice(token: string) {
		submitGuess(token.trim().toLowerCase());
	}

	function submitGuess(g: string) {
		const chosenToken = pendingEvent.chosen.token.trim().toLowerCase();
		const altTokens = pendingEvent.alternatives.map((a) => a.token.trim().toLowerCase());

		if (g === chosenToken) {
			result = 'exact';
			resultMessage = "You think like an AI!";
		} else if (altTokens.includes(g)) {
			result = 'close';
			const alt = pendingEvent.alternatives.find((a) => a.token.trim().toLowerCase() === g);
			resultMessage = `Close! The AI considered "${alt?.token.trim()}" (${formatProbability(alt?.probability ?? 0)}) but picked "${pendingEvent.chosen.token.trim()}"`;
		} else {
			result = 'miss';
			resultMessage = `The AI didn't consider that! It picked "${pendingEvent.chosen.token.trim()}"`;
		}

		showingResult = true;
		// Auto-advance after showing result
		setTimeout(() => {
			onGuess(g);
			reset();
		}, 1500);
	}

	function skip() {
		onSkip();
		reset();
	}

	function reset() {
		guess = '';
		result = null;
		resultMessage = '';
		showingResult = false;
	}

	// Show top 4 alternatives as multiple-choice options (shuffled)
	const choices = $derived(() => {
		const alts = pendingEvent.alternatives.slice(0, 4).map((a) => a.token.trim());
		// Shuffle
		const shuffled = [...alts];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	});
</script>

<div
	class="rounded-xl border p-4"
	style="background: var(--pv-surface); border-color: var(--pv-accent)"
	transition:fly={{ y: 10, duration: 200 }}
>
	<!-- Score bar -->
	<div class="mb-3 flex items-center justify-between text-xs" style="color: var(--pv-text-muted)">
		<span>
			{#if streak > 0}
				&#x1F525; Streak: {streak}
			{:else}
				Word #{totalRevealed + 1}
			{/if}
		</span>
		<span>Score: {score}</span>
	</div>

	{#if showingResult}
		<!-- Result display -->
		<div class="py-3 text-center">
			<div class="mb-1 text-2xl">
				{#if result === 'exact'}&#x1F389;{:else if result === 'close'}&#x1F44D;{:else}&#x1F914;{/if}
			</div>
			<p class="text-sm font-medium" style="color: {result === 'exact' ? 'var(--pv-success)' : result === 'close' ? 'var(--pv-warning)' : 'var(--pv-text-secondary)'}">
				{resultMessage}
			</p>
		</div>
	{:else}
		<!-- Guess prompt -->
		<p class="mb-3 text-center text-sm font-medium" style="color: var(--pv-text-primary)">
			What word comes next?
		</p>

		<!-- Multiple choice buttons -->
		<div class="mb-3 grid grid-cols-2 gap-2">
			{#each choices() as choice}
				<button
					class="rounded-lg border px-3 py-2 text-sm font-mono transition-colors hover:opacity-80"
					style="border-color: var(--pv-border); background: var(--pv-bg); color: var(--pv-text-primary)"
					onclick={() => handleChoice(choice)}
				>
					{choice || '(space)'}
				</button>
			{/each}
		</div>

		<!-- Free text input -->
		<form onsubmit={handleSubmit} class="flex gap-2">
			<input
				type="text"
				bind:value={guess}
				placeholder="Or type your own guess..."
				class="flex-1 rounded-lg border-none px-3 py-1.5 text-sm outline-none"
				style="background: var(--pv-bg); color: var(--pv-text-primary)"
			/>
			<button
				type="submit"
				disabled={!guess.trim()}
				class="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
				style="background: var(--pv-accent)"
			>
				Guess
			</button>
			<button
				type="button"
				onclick={skip}
				class="rounded-lg px-3 py-1.5 text-xs"
				style="color: var(--pv-text-muted)"
			>
				Skip
			</button>
		</form>
	{/if}
</div>
