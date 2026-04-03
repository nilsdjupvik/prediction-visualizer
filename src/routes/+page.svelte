<script lang="ts">
	import Header from '../components/Header.svelte';
	import PromptInput from '../components/PromptInput.svelte';
	import GenerationView from '../components/GenerationView.svelte';
	import ParameterControls from '../components/ParameterControls.svelte';
	import ConnectionStatus from '../components/ConnectionStatus.svelte';
	import HowItWorks from '../components/HowItWorks.svelte';
	import Challenges from '../components/Challenges.svelte';
	import { createGenerationSession } from '$lib/generation.svelte.js';
	import { checkConnection, fetchModels } from '$lib/connection.js';
	import { DEFAULT_PARAMETERS } from '$lib/types.js';
	import type { GenerationParameters, OllamaModel, DifficultyLevel } from '$lib/types.js';

	const session = createGenerationSession();

	let connected = $state(false);
	let models = $state<OllamaModel[]>([]);
	let selectedModel = $state('');
	let parameters = $state<GenerationParameters>({ ...DEFAULT_PARAMETERS });
	let level = $state<DifficultyLevel>(
		(typeof localStorage !== 'undefined' && localStorage.getItem('pv-level') as DifficultyLevel) || 'kids'
	);
	let selectedTokenIndex = $state<number | null>(null);
	let thinkingEnabled = $state(false);
	let playAlong = $state(false);
	let storyRemix = $state(false);
	let previousRun = $state<import('$lib/types.js').TokenEvent[]>([]);
	let showComparison = $state(false);
	let gameScore = $state(0);
	let gameStreak = $state(0);

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('pv-level', level);
		}
	});

	async function init() {
		connected = await checkConnection();
		if (connected) {
			models = await fetchModels();
			if (models.length > 0 && !selectedModel) {
				// Prefer small models for fast demos
				const preferred = ['gemma3:270m', 'gemma3:1b', 'qwen3:0.6b', 'llama3.2:1b'];
				const found = preferred.find((p) => models.some((m) => m.name === p));
				selectedModel = found ?? models[0].name;
			}
		}
	}

	// Check connection on mount and periodically
	$effect(() => {
		init();
		const interval = setInterval(init, 10000);
		return () => clearInterval(interval);
	});

	function handleGenerate(prompt: string) {
		selectedTokenIndex = null;
		gameScore = 0;
		gameStreak = 0;
		session.generate(prompt, selectedModel, parameters, thinkingEnabled, playAlong, storyRemix);
	}

	function handleTokenSelect(index: number) {
		selectedTokenIndex = selectedTokenIndex === index ? null : index;
	}

	function handleRerun(temp: number) {
		const savedPrompt = session.prompt;
		parameters.temperature = temp;
		selectedTokenIndex = null;
		showComparison = false;
		session.generate(savedPrompt, selectedModel, parameters, thinkingEnabled, false);
	}

	function handleCompare() {
		previousRun = [...session.tokens];
		showComparison = true;
		const savedPrompt = session.prompt;
		selectedTokenIndex = null;
		session.generate(savedPrompt, selectedModel, parameters, thinkingEnabled, false);
	}
</script>

<svelte:head>
	<title>Prediction Visualizer — Watch an AI think</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-6">
	<Header {level} onLevelChange={(l) => (level = l)} />

	<ConnectionStatus {connected} {models} bind:selectedModel />

	{#if connected && selectedModel}
		<PromptInput
			onGenerate={handleGenerate}
			disabled={session.status === 'generating'}
			onStop={() => session.stop()}
			generating={session.status === 'generating'}
			bind:thinkingEnabled
			bind:playAlong
			bind:storyRemix
		/>

		<ParameterControls bind:parameters {level} />

		{#if session.status === 'idle' && session.tokens.length === 0}
			<Challenges onStartChallenge={(prompt, temp) => {
				parameters.temperature = temp;
				handleGenerate(prompt);
			}} />
			<HowItWorks {level} />
		{/if}

		{#if session.tokens.length > 0 || session.status === 'generating' || session.pendingTokens.length > 0}
			<GenerationView
				{session}
				{level}
				{selectedTokenIndex}
				onTokenSelect={handleTokenSelect}
				temperature={parameters.temperature}
				topP={parameters.topP}
				bind:gameScore
				bind:gameStreak
				onRerun={handleRerun}
				onCompare={handleCompare}
				{previousRun}
				{showComparison}
			/>
		{/if}
	{/if}
</div>
