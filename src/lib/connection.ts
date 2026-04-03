import type { OllamaModel } from './types.js';

const OLLAMA_BASE = 'http://localhost:11434';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export async function checkConnection(): Promise<boolean> {
	try {
		const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
		return res.ok;
	} catch {
		return false;
	}
}

export async function fetchModels(): Promise<OllamaModel[]> {
	const res = await fetch(`${OLLAMA_BASE}/api/tags`);
	if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
	const data = await res.json();
	return data.models ?? [];
}

export function getOllamaBase(): string {
	return OLLAMA_BASE;
}
