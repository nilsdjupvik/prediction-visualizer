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

<form onsubmit={handleSubmit} class="mb-8">
	<label for="prompt-input" class="mb-3 block text-sm font-medium" style="color: var(--pv-text-secondary)">
		Type something for the AI to continue...
	</label>
	<div class="flex gap-3">
		<input
			id="prompt-input"
			type="text"
			bind:value={prompt}
			placeholder="Once upon a time..."
			class="min-h-[52px] flex-1 rounded-xl border-2 px-5 py-3 text-lg outline-none"
			style="
				background: var(--pv-surface);
				color: var(--pv-text-primary);
				font-family: var(--pv-font-body);
				border-color: {disabled ? 'var(--pv-border)' : 'transparent'};
				transition: border-color var(--pv-duration-fast) var(--pv-ease-out);
			"
			onfocus={(e: FocusEvent) => {
				const el = e.currentTarget as HTMLElement;
				el.style.borderColor = 'var(--pv-accent)';
			}}
			onblur={(e: FocusEvent) => {
				const el = e.currentTarget as HTMLElement;
				el.style.borderColor = 'transparent';
			}}
			{disabled}
		/>
		{#if generating}
			<button
				type="button"
				onclick={onStop}
				class="min-h-[52px] rounded-xl px-7 py-3 font-semibold transition-all"
				style="
					background: var(--pv-error);
					color: white;
					font-family: var(--pv-font-display);
					transition-timing-function: var(--pv-ease-out);
				"
			>
				Stop
			</button>
		{:else}
			<button
				type="submit"
				disabled={!prompt.trim() || disabled}
				class="min-h-[52px] rounded-xl px-7 py-3 font-semibold transition-all disabled:opacity-30"
				style="
					background: var(--pv-accent);
					color: var(--pv-bg);
					font-family: var(--pv-font-display);
					transition-timing-function: var(--pv-ease-out);
				"
			>
				Generate
			</button>
		{/if}
	</div>

	<!-- Mode toggles + suggestions — laid out more openly -->
	<div class="mt-4 flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="flex min-h-[36px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all"
			style="
				{thinkingEnabled
					? 'border-color: var(--pv-accent); color: var(--pv-accent); background: var(--pv-accent-subtle);'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: transparent;'}
				transition-timing-function: var(--pv-ease-out);
			"
			onclick={() => (thinkingEnabled = !thinkingEnabled)}
			disabled={generating}
			title="When enabled, the model thinks step-by-step before answering (requires a thinking model like Qwen3)"
		>
			<span>{thinkingEnabled ? '🧠' : '💭'}</span>
			Thinking {thinkingEnabled ? 'ON' : 'OFF'}
		</button>

		<button
			type="button"
			class="flex min-h-[36px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all"
			style="
				{playAlong
					? 'border-color: var(--pv-success); color: var(--pv-success); background: oklch(36% 0.1 165 / 12%);'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: transparent;'}
				transition-timing-function: var(--pv-ease-out);
			"
			onclick={() => (playAlong = !playAlong)}
			disabled={generating}
			title="Guess each word before the AI reveals it"
		>
			<span>{playAlong ? '🎮' : '🎲'}</span>
			Play Along {playAlong ? 'ON' : 'OFF'}
		</button>

		<button
			type="button"
			class="flex min-h-[36px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all"
			style="
				{storyRemix
					? 'border-color: var(--pv-chosen-ring); color: var(--pv-chosen-ring); background: oklch(82% 0.15 85 / 12%);'
					: 'border-color: var(--pv-border); color: var(--pv-text-muted); background: transparent;'}
				transition-timing-function: var(--pv-ease-out);
			"
			onclick={() => { storyRemix = !storyRemix; if (storyRemix) playAlong = false; }}
			disabled={generating}
			title="At uncertain moments, YOU pick which word continues the story!"
		>
			<span>{storyRemix ? '🔀' : '📖'}</span>
			Story Remix {storyRemix ? 'ON' : 'OFF'}
		</button>

		<span class="mx-1 hidden text-xs sm:inline" style="color: var(--pv-border)">|</span>

		{#each suggestions as suggestion}
			<button
				type="button"
				class="min-h-[36px] rounded-full border px-3 py-1.5 text-xs transition-all"
				style="
					border-color: var(--pv-border);
					color: var(--pv-text-secondary);
					background: transparent;
					transition-timing-function: var(--pv-ease-out);
				"
				onclick={() => (prompt = suggestion)}
				disabled={generating}
			>
				{suggestion}
			</button>
		{/each}
	</div>
</form>
