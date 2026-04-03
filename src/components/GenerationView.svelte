<script lang="ts">
	import type { DifficultyLevel } from '$lib/types.js';
	import type { createGenerationSession } from '$lib/generation.svelte.js';
	import TokenStream from './TokenStream.svelte';
	import ProbabilityPanel from './ProbabilityPanel.svelte';
	import FormattedOutput from './FormattedOutput.svelte';
	import ExplanationPanel from './ExplanationPanel.svelte';
	import ConfidenceSparkline from './ConfidenceSparkline.svelte';
	import GuessTheWord from './GuessTheWord.svelte';
	import ExperimentDeck from './ExperimentDeck.svelte';
	import StoryRemixChoice from './StoryRemixChoice.svelte';
	import CompareRuns from './CompareRuns.svelte';
	import type { TokenEvent } from '$lib/types.js';

	let {
		session,
		level,
		selectedTokenIndex,
		onTokenSelect,
		temperature,
		topP,
		gameScore = $bindable(0),
		gameStreak = $bindable(0),
		onRerun,
		onCompare,
		previousRun = [],
		showComparison = false
	}: {
		session: ReturnType<typeof createGenerationSession>;
		level: DifficultyLevel;
		selectedTokenIndex: number | null;
		onTokenSelect: (index: number) => void;
		temperature: number;
		topP: number;
		gameScore: number;
		gameStreak: number;
		onRerun: (temperature: number) => void;
		onCompare: () => void;
		previousRun?: TokenEvent[];
		showComparison?: boolean;
	} = $props();

	const selectedEvent = $derived(
		selectedTokenIndex !== null ? session.tokens[selectedTokenIndex] : null
	);

	// In live mode, show the latest token's distribution
	const liveEvent = $derived(
		session.status === 'generating' && session.tokens.length > 0
			? session.tokens[session.tokens.length - 1]
			: null
	);

	const displayEvent = $derived(selectedEvent ?? liveEvent);

	let showFormatted = $state(false);
</script>

<div class="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
	<!-- Left: Token stream + formatted output -->
	<div>
		<!-- Tab switcher -->
		<div class="mb-2 flex gap-1 rounded-lg p-1" style="background: var(--pv-surface)">
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
				style={!showFormatted
					? 'background: var(--pv-accent); color: white;'
					: 'color: var(--pv-text-secondary);'}
				onclick={() => (showFormatted = false)}
			>
				Token View
			</button>
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
				style={showFormatted
					? 'background: var(--pv-accent); color: white;'
					: 'color: var(--pv-text-secondary);'}
				onclick={() => (showFormatted = true)}
			>
				Formatted Text
			</button>
		</div>

		<!-- Confidence sparkline -->
		{#if !showFormatted && session.tokens.length > 1}
			<ConfidenceSparkline
				tokens={session.tokens}
				{selectedTokenIndex}
				{onTokenSelect}
			/>
		{/if}

		{#if showFormatted}
			<FormattedOutput prompt={session.prompt} tokens={session.tokens} generating={session.status === 'generating'} />
		{:else}
			<TokenStream
				prompt={session.prompt}
				tokens={session.tokens}
				{selectedTokenIndex}
				{level}
				{onTokenSelect}
			/>
		{/if}

		<!-- Status / stats -->
		<div class="mt-2 flex items-center gap-3">
			{#if session.status === 'generating'}
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 animate-pulse rounded-full" style="background: var(--pv-accent)"></div>
					<span class="text-xs" style="color: var(--pv-text-muted)">
						Generating... ({session.tokens.length} tokens)
					</span>
				</div>
			{:else if session.status === 'complete' && session.timing}
				<span class="text-xs" style="color: var(--pv-text-muted)">
					{session.tokens.length} tokens in {session.timing.totalDuration.toFixed(1)}s
					({session.timing.tokensPerSecond.toFixed(0)} tok/s)
				</span>
			{:else if session.status === 'error'}
				<span class="text-xs" style="color: var(--pv-error)">
					Error: {session.error}
				</span>
			{/if}

			{#if session.status === 'complete' && selectedTokenIndex === null && !showFormatted}
				<span class="text-xs" style="color: var(--pv-text-muted)">
					&#x1F449; Click any word to see what the AI was thinking!
				</span>
			{/if}
		</div>

		<!-- Experiment deck -->
		{#if session.status === 'complete' && !session.gameMode && !session.remixMode && session.tokens.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<ExperimentDeck
					tokens={session.tokens}
					prompt={session.prompt}
					{onRerun}
					onSelectToken={onTokenSelect}
				/>
				{#if level !== 'kids'}
					<button
						class="mt-4 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105"
						style="border-color: var(--pv-border); background: var(--pv-surface); color: var(--pv-text-primary)"
						onclick={onCompare}
						title="Run the same prompt again and compare the two outputs side by side"
					>
						&#x1F500; Compare runs
					</button>
				{/if}
			</div>
		{/if}

		<!-- Comparison view -->
		{#if showComparison && previousRun.length > 0 && session.status === 'complete'}
			<CompareRuns
				runA={previousRun}
				runB={session.tokens}
				prompt={session.prompt}
			/>
		{/if}
	</div>

	<!-- Right: Game panel or Probability panel + explanation -->
	<div>
		{#if session.remixMode && session.nextPending}
			<StoryRemixChoice
				pendingEvent={session.nextPending}
				onChoose={(altIndex) => session.revealWithChoice(altIndex)}
				onLetAIPick={() => session.revealNext()}
				choiceCount={session.remixChoices.length}
			/>
		{:else if session.gameMode && session.nextPending}
			<GuessTheWord
				pendingEvent={session.nextPending}
				onGuess={(guess) => {
					const pending = session.nextPending;
					if (!pending) return;
					const chosenToken = pending.chosen.token.trim().toLowerCase();
					const altTokens = pending.alternatives.map(a => a.token.trim().toLowerCase());
					if (guess === chosenToken) {
						gameStreak++;
						const points = pending.chosen.probability < 0.1 ? 5 : pending.chosen.probability < 0.3 ? 3 : 1;
						gameScore += points;
					} else if (altTokens.includes(guess)) {
						gameStreak = 0;
						gameScore += 1;
					} else {
						gameStreak = 0;
					}
					session.revealNext();
				}}
				onSkip={() => {
					gameStreak = 0;
					session.revealNext();
				}}
				streak={gameStreak}
				score={gameScore}
				totalRevealed={session.tokens.length}
			/>
		{:else if displayEvent && displayEvent.alternatives.length > 0}
			<ProbabilityPanel event={displayEvent} {level} {temperature} {topP} />
			<ExplanationPanel
				event={displayEvent}
				{level}
				tokenCount={session.tokens.length}
				status={session.status}
			/>
		{:else if session.status === 'generating'}
			<div
				class="flex h-40 items-center justify-center rounded-xl border"
				style="background: var(--pv-surface); border-color: var(--pv-border)"
			>
				<p class="text-sm" style="color: var(--pv-text-muted)">
					{session.gameMode ? 'Generating words for you to guess...' : level === 'kids' ? 'The AI is calculating probabilities...' : 'Waiting for tokens...'}
				</p>
			</div>
		{/if}

		<!-- Game complete summary -->
		{#if session.gameMode && session.status === 'complete' && session.pendingTokens.length === 0 && session.tokens.length > 0}
			<div
				class="mt-3 rounded-xl border p-4 text-center"
				style="background: var(--pv-surface); border-color: var(--pv-success)"
			>
				<p class="text-lg font-bold" style="color: var(--pv-success)">&#x1F389; Game Over!</p>
				<p class="mt-1 text-sm" style="color: var(--pv-text-secondary)">
					Score: <strong>{gameScore}</strong> points
				</p>
				<p class="text-xs" style="color: var(--pv-text-muted)">
					You matched the AI's thinking on {session.tokens.length} words. Try again to beat your score!
				</p>
			</div>
		{/if}
	</div>
</div>
