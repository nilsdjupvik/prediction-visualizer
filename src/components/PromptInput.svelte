<script lang="ts">
	let {
		onGenerate,
		onStop,
		disabled,
		generating,
		thinkingEnabled = $bindable(false),
		playAlong = $bindable(false),
		storyRemix = $bindable(false)
	}: {
		onGenerate: (prompt: string) => void;
		onStop: () => void;
		disabled: boolean;
		generating: boolean;
		thinkingEnabled: boolean;
		playAlong: boolean;
		storyRemix: boolean;
	} = $props();

	let prompt = $state('');

	const suggestions = [
		'Once upon a time there was a',
		'The best pizza topping is',
		'In a land far away, a robot',
		'The secret to happiness is',
		'Why is the sky blue? Because'
	];

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (prompt.trim() && !disabled) {
			onGenerate(prompt.trim());
		}
	}
</script>

<form onsubmit={handleSubmit} class="mb-6">
	<div
		class="rounded-xl border p-4 transition-colors"
		style="background: var(--pv-surface); border-color: var(--pv-border)"
	>
		<label for="prompt-input" class="mb-2 block text-sm font-medium" style="color: var(--pv-text-secondary)">
			Type something for the AI to continue...
		</label>
		<div class="flex gap-3">
			<input
				id="prompt-input"
				type="text"
				bind:value={prompt}
				placeholder="Once upon a time..."
				class="flex-1 rounded-lg border-none px-4 py-3 text-lg outline-none"
				style="background: var(--pv-bg); color: var(--pv-text-primary); font-family: var(--pv-font-body)"
				{disabled}
			/>
			{#if generating}
				<button
					type="button"
					onclick={onStop}
					class="rounded-lg px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80"
					style="background: var(--pv-error)"
				>
					Stop
				</button>
			{:else}
				<button
					type="submit"
					disabled={!prompt.trim() || disabled}
					class="rounded-lg px-6 py-3 font-semibold text-white transition-opacity disabled:opacity-40"
					style="background: var(--pv-accent)"
				>
					Generate
				</button>
			{/if}
		</div>

		<!-- Thinking toggle + Suggestion chips -->
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
				style={thinkingEnabled
					? 'border-color: var(--pv-accent); color: var(--pv-accent); background: color-mix(in srgb, var(--pv-accent) 15%, var(--pv-bg));'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: var(--pv-bg);'}
				onclick={() => (thinkingEnabled = !thinkingEnabled)}
				disabled={generating}
				title="When enabled, the model thinks step-by-step before answering (requires a thinking model like Qwen3)"
			>
				<span>{thinkingEnabled ? '&#x1F9E0;' : '&#x1F4AD;'}</span>
				Thinking {thinkingEnabled ? 'ON' : 'OFF'}
			</button>

			<button
				type="button"
				class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
				style={playAlong
					? 'border-color: var(--pv-success); color: var(--pv-success); background: color-mix(in srgb, var(--pv-success) 15%, var(--pv-bg));'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: var(--pv-bg);'}
				onclick={() => (playAlong = !playAlong)}
				disabled={generating}
				title="Guess each word before the AI reveals it — can you think like an AI?"
			>
				<span>{playAlong ? '&#x1F3AE;' : '&#x1F3B2;'}</span>
				Play Along {playAlong ? 'ON' : 'OFF'}
			</button>

			<button
				type="button"
				class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
				style={storyRemix
					? 'border-color: var(--pv-chosen-ring); color: var(--pv-chosen-ring); background: color-mix(in srgb, var(--pv-chosen-ring) 15%, var(--pv-bg));'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: var(--pv-bg);'}
				onclick={() => { storyRemix = !storyRemix; if (storyRemix) playAlong = false; }}
				disabled={generating}
				title="At uncertain moments, YOU pick which word continues the story!"
			>
				<span>{storyRemix ? '&#x1F500;' : '&#x1F4D6;'}</span>
				Story Remix {storyRemix ? 'ON' : 'OFF'}
			</button>

			<span class="mx-1 text-xs" style="color: var(--pv-border)">|</span>

			{#each suggestions as suggestion}
				<button
					type="button"
					class="rounded-full border px-3 py-1 text-xs transition-colors hover:opacity-80"
					style="border-color: var(--pv-border); color: var(--pv-text-secondary); background: var(--pv-bg)"
					onclick={() => (prompt = suggestion)}
					disabled={generating}
				>
					{suggestion}
				</button>
			{/each}
		</div>
	</div>
</form>
