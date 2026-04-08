<script lang="ts">
	import type { OllamaModel } from '$lib/types.js';

	let {
		connected,
		models,
		selectedModel = $bindable()
	}: {
		connected: boolean;
		models: OllamaModel[];
		selectedModel: string;
	} = $props();
</script>

{#if !connected}
	<div
		class="mb-8 rounded-xl border-l-4 p-6"
		style="background: var(--pv-surface); border-color: var(--pv-error)"
	>
		<h2 class="mb-2 text-lg font-bold" style="color: var(--pv-error); font-family: var(--pv-font-display)">
			Can't reach Ollama
		</h2>
		<p class="mb-4 text-sm leading-relaxed" style="color: var(--pv-text-secondary)">
			This app needs Ollama running locally on your computer. It's free and runs your own AI!
		</p>
		<ol class="list-inside list-decimal space-y-3 text-sm" style="color: var(--pv-text-secondary)">
			<li>
				Install Ollama from
				<span class="font-semibold" style="color: var(--pv-accent)">ollama.com</span>
			</li>
			<li>
				Open your terminal and run:
				<code
					class="ml-1 rounded-md px-2 py-1 font-mono text-xs"
					style="background: var(--pv-bg); color: var(--pv-accent)"
				>
					ollama pull gemma3:270m
				</code>
			</li>
			<li>Make sure Ollama is running (it starts automatically after install)</li>
			<li>Refresh this page</li>
		</ol>
	</div>
{:else if models.length === 0}
	<div
		class="mb-8 rounded-xl border-l-4 p-6"
		style="background: var(--pv-surface); border-color: var(--pv-warning)"
	>
		<h2 class="mb-2 text-lg font-bold" style="color: var(--pv-warning); font-family: var(--pv-font-display)">
			No models found
		</h2>
		<p class="text-sm" style="color: var(--pv-text-secondary)">
			Ollama is running, but you need to download a model first. Run:
			<code
				class="ml-1 rounded-md px-2 py-1 font-mono text-xs"
				style="background: var(--pv-bg); color: var(--pv-accent)"
			>
				ollama pull gemma3:270m
			</code>
		</p>
	</div>
{:else}
	<div class="mb-6 flex items-center gap-3">
		<div class="h-2.5 w-2.5 rounded-full" style="background: var(--pv-success)"></div>
		<span class="text-xs font-medium" style="color: var(--pv-text-muted)">Connected</span>
		<select
			class="min-h-[40px] rounded-lg border px-3 py-2 text-sm"
			style="background: var(--pv-surface); border-color: var(--pv-border); color: var(--pv-text-primary)"
			bind:value={selectedModel}
			aria-label="Select AI model"
		>
			{#each models as m}
				<option value={m.name}>{m.name}</option>
			{/each}
		</select>
	</div>
{/if}
