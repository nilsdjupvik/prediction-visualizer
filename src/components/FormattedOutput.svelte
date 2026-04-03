<script lang="ts">
	import type { TokenEvent } from '$lib/types.js';

	let {
		prompt,
		tokens,
		generating
	}: {
		prompt: string;
		tokens: TokenEvent[];
		generating: boolean;
	} = $props();

	const thinkingText = $derived(tokens.filter((t) => t.isThinking).map((t) => t.chosen.token).join(''));
	const responseText = $derived(tokens.filter((t) => !t.isThinking).map((t) => t.chosen.token).join(''));
	const hasThinking = $derived(thinkingText.length > 0);
	const fullText = $derived(prompt + responseText);
	let thinkingCollapsed = $state(false);

	/** Simple markdown to HTML renderer — handles headings, bold, italic, code, lists, paragraphs */
	function renderMarkdown(text: string): string {
		let html = text
			// Escape HTML
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			// Code blocks (fenced)
			.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="pv-codeblock"><code>$2</code></pre>')
			// Inline code
			.replace(/`([^`]+)`/g, '<code class="pv-inline-code">$1</code>')
			// Headings
			.replace(/^#### (.+)$/gm, '<h4 class="pv-h4">$1</h4>')
			.replace(/^### (.+)$/gm, '<h3 class="pv-h3">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 class="pv-h2">$1</h2>')
			.replace(/^# (.+)$/gm, '<h1 class="pv-h1">$1</h1>')
			// Bold + italic
			.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
			// Bold
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			// Italic
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			// Unordered lists
			.replace(/^[*-] (.+)$/gm, '<li class="pv-li">$1</li>')
			// Ordered lists
			.replace(/^\d+\. (.+)$/gm, '<li class="pv-li-ordered">$1</li>')
			// Horizontal rule
			.replace(/^---$/gm, '<hr class="pv-hr" />')
			// Line breaks — double newline = paragraph break
			.replace(/\n\n/g, '</p><p class="pv-p">')
			// Single newline = line break
			.replace(/\n/g, '<br />');

		// Wrap consecutive <li> elements in <ul>
		html = html.replace(
			/(<li class="pv-li">.*?<\/li>(\s*<br \/>)?)+/g,
			(match) => '<ul class="pv-ul">' + match.replace(/<br \/>/g, '') + '</ul>'
		);

		// Wrap consecutive ordered <li> in <ol>
		html = html.replace(
			/(<li class="pv-li-ordered">.*?<\/li>(\s*<br \/>)?)+/g,
			(match) => '<ol class="pv-ol">' + match.replace(/<br \/>/g, '') + '</ol>'
		);

		return '<p class="pv-p">' + html + '</p>';
	}

	const renderedHtml = $derived(renderMarkdown(fullText));
</script>

<div
	class="max-h-96 overflow-y-auto rounded-xl border p-5"
	style="background: var(--pv-surface); border-color: var(--pv-border)"
>
	<!-- Thinking section -->
	{#if hasThinking}
		<div
			class="mb-4 rounded-lg border p-3"
			style="background: color-mix(in srgb, var(--pv-accent) 5%, var(--pv-bg)); border-color: color-mix(in srgb, var(--pv-accent) 30%, var(--pv-border))"
		>
			<button
				class="flex w-full items-center gap-2 text-left text-xs font-semibold"
				style="color: var(--pv-accent)"
				onclick={() => (thinkingCollapsed = !thinkingCollapsed)}
			>
				<span class="transition-transform" style="transform: rotate({thinkingCollapsed ? '0' : '90'}deg)">&#x25B6;</span>
				&#x1F9E0; Thinking
			</button>
			{#if !thinkingCollapsed}
				<div class="mt-2 text-sm italic leading-relaxed" style="color: var(--pv-text-secondary)">
					{thinkingText}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Response -->
	<div class="pv-formatted-output">
		{@html renderedHtml}
		{#if generating}
			<span class="inline-block h-4 w-0.5 animate-pulse" style="background: var(--pv-accent)"></span>
		{/if}
	</div>
</div>

<style>
	.pv-formatted-output {
		font-family: var(--pv-font-body);
		color: var(--pv-text-primary);
		line-height: 1.7;
		font-size: 0.95rem;
	}

	.pv-formatted-output :global(.pv-p) {
		margin-bottom: 0.75em;
	}

	.pv-formatted-output :global(.pv-p:empty) {
		display: none;
	}

	.pv-formatted-output :global(.pv-h1) {
		font-family: var(--pv-font-display);
		font-size: 1.5rem;
		font-weight: 800;
		margin: 1em 0 0.5em;
	}

	.pv-formatted-output :global(.pv-h2) {
		font-family: var(--pv-font-display);
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.8em 0 0.4em;
	}

	.pv-formatted-output :global(.pv-h3) {
		font-family: var(--pv-font-display);
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0.6em 0 0.3em;
	}

	.pv-formatted-output :global(.pv-h4) {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.5em 0 0.25em;
	}

	.pv-formatted-output :global(strong) {
		font-weight: 600;
		color: var(--pv-text-primary);
	}

	.pv-formatted-output :global(em) {
		font-style: italic;
		color: var(--pv-text-secondary);
	}

	.pv-formatted-output :global(.pv-inline-code) {
		font-family: var(--pv-font-mono);
		font-size: 0.85em;
		background: var(--pv-bg);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		color: var(--pv-accent);
	}

	.pv-formatted-output :global(.pv-codeblock) {
		font-family: var(--pv-font-mono);
		font-size: 0.85em;
		background: var(--pv-bg);
		padding: 1em;
		border-radius: 8px;
		overflow-x: auto;
		margin: 0.75em 0;
		border: 1px solid var(--pv-border);
	}

	.pv-formatted-output :global(.pv-ul),
	.pv-formatted-output :global(.pv-ol) {
		padding-left: 1.5em;
		margin: 0.5em 0;
	}

	.pv-formatted-output :global(.pv-ul) {
		list-style: disc;
	}

	.pv-formatted-output :global(.pv-ol) {
		list-style: decimal;
	}

	.pv-formatted-output :global(.pv-li),
	.pv-formatted-output :global(.pv-li-ordered) {
		margin: 0.25em 0;
	}

	.pv-formatted-output :global(.pv-hr) {
		border: none;
		border-top: 1px solid var(--pv-border);
		margin: 1em 0;
	}
</style>
