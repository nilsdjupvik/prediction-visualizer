import type { TokenEvent, GenerationParameters, GenerationSession } from './types.js';
import { normalizeTopLogprobs } from './probability.js';
import { getOllamaBase } from './connection.js';

function makeId(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function createGenerationSession() {
	let tokens = $state<TokenEvent[]>([]);
	let pendingTokens = $state<TokenEvent[]>([]);
	let gameMode = $state(false);
	let remixMode = $state(false);
	let remixChoices = $state<number[]>([]);
	let status = $state<GenerationSession['status']>('idle');
	let error = $state<string | undefined>(undefined);
	let model = $state('');
	let prompt = $state('');
	let timing = $state<GenerationSession['timing']>(undefined);
	let abortController: AbortController | null = null;

	async function generate(
		userPrompt: string,
		selectedModel: string,
		params: GenerationParameters,
		enableThinking: boolean = false,
		enableGameMode: boolean = false,
		enableRemixMode: boolean = false
	) {
		tokens = [];
		pendingTokens = [];
		gameMode = enableGameMode;
		remixMode = enableRemixMode;
		remixChoices = [];
		status = 'generating';
		error = undefined;
		model = selectedModel;
		prompt = userPrompt;
		timing = undefined;
		abortController = new AbortController();

		try {
			const res = await fetch(`${getOllamaBase()}/api/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				signal: abortController.signal,
				body: JSON.stringify({
					model: selectedModel,
					prompt: userPrompt,
					raw: !enableThinking,
					stream: true,
					logprobs: true,
					top_logprobs: params.topLogprobs,
					think: enableThinking,
					options: {
						temperature: params.temperature,
						top_k: params.topK,
						top_p: params.topP,
						num_predict: params.numPredict,
						repeat_penalty: params.repeatPenalty,
						repeat_last_n: params.repeatLastN
					}
				})
			});

			if (!res.ok) {
				throw new Error(`Ollama returned ${res.status}: ${await res.text()}`);
			}

			const reader = res.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let index = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					if (!line.trim()) continue;
					const chunk = JSON.parse(line);

					// Determine if this chunk is a thinking token
					const isThinking = !!(chunk.thinking && !chunk.response);
					const tokenText = isThinking ? chunk.thinking : chunk.response;

					if (chunk.logprobs?.length) {
						const lp = chunk.logprobs[0];
						const alternatives = normalizeTopLogprobs(
							(lp.top_logprobs ?? []).map(
								(t: { token: string; logprob: number; bytes: number[] }) => ({
									token: t.token,
									logprob: t.logprob,
									bytes: t.bytes ?? []
								})
							)
						);

						const chosen = alternatives.find((a) => a.token === lp.token) ?? {
							token: lp.token,
							logprob: lp.logprob,
							probability: Math.exp(lp.logprob),
							bytes: lp.bytes ?? []
						};

						const tokenEvent: TokenEvent = {
							index: index++,
							chosen,
							alternatives,
							timestamp: performance.now(),
							isThinking
						};
						if (gameMode && !isThinking) {
							pendingTokens.push(tokenEvent);
						} else if (remixMode && !isThinking) {
							// In remix mode, only pause on uncertain tokens (flat distribution)
							const topProb = tokenEvent.alternatives[0]?.probability ?? 1;
							const secondProb = tokenEvent.alternatives[1]?.probability ?? 0;
							const isUncertain = topProb - secondProb < 0.15 && tokenEvent.alternatives.length >= 3;
							if (isUncertain) {
								pendingTokens.push(tokenEvent);
							} else {
								tokens.push(tokenEvent);
							}
						} else {
							tokens.push(tokenEvent);
						}
					} else if (tokenText && !chunk.done) {
						const tokenEvent2: TokenEvent = {
							index: index++,
							chosen: {
								token: tokenText,
								logprob: 0,
								probability: 1,
								bytes: []
							},
							alternatives: [],
							timestamp: performance.now(),
							isThinking
						};
						if (gameMode && !isThinking) {
							pendingTokens.push(tokenEvent2);
						} else {
							// No logprobs = no choice to make, always reveal
							tokens.push(tokenEvent2);
						}
					}

					if (chunk.done) {
						status = 'complete';
						if (chunk.eval_count && chunk.eval_duration) {
							const evalDurationSec = chunk.eval_duration / 1e9;
							timing = {
								totalDuration: (chunk.total_duration ?? 0) / 1e9,
								evalCount: chunk.eval_count,
								evalDuration: evalDurationSec,
								tokensPerSecond:
									evalDurationSec > 0 ? chunk.eval_count / evalDurationSec : 0
							};
						}
					}
				}
			}

			if (status === 'generating') {
				status = 'complete';
			}
		} catch (e) {
			if ((e as Error).name === 'AbortError') {
				status = 'idle';
			} else {
				status = 'error';
				error = (e as Error).message;
			}
		} finally {
			abortController = null;
		}
	}

	function stop() {
		abortController?.abort();
	}

	function revealNext(): TokenEvent | null {
		if (pendingTokens.length === 0) return null;
		const next = pendingTokens.shift()!;
		pendingTokens = pendingTokens;
		tokens.push(next);
		tokens = tokens;
		return next;
	}

	/** Reveal next pending token but override the chosen token with an alternative */
	function revealWithChoice(altIndex: number): TokenEvent | null {
		if (pendingTokens.length === 0) return null;
		const next = pendingTokens.shift()!;
		pendingTokens = pendingTokens;
		if (altIndex >= 0 && altIndex < next.alternatives.length) {
			next.chosen = next.alternatives[altIndex];
			remixChoices.push(next.index);
			remixChoices = remixChoices;
		}
		tokens.push(next);
		tokens = tokens;
		return next;
	}

	function revealAll() {
		tokens.push(...pendingTokens);
		tokens = tokens;
		pendingTokens = [];
	}

	function reset() {
		stop();
		tokens = [];
		pendingTokens = [];
		gameMode = false;
		remixMode = false;
		remixChoices = [];
		status = 'idle';
		error = undefined;
		timing = undefined;
	}

	return {
		get tokens() {
			return tokens;
		},
		get pendingTokens() {
			return pendingTokens;
		},
		get nextPending() {
			return pendingTokens.length > 0 ? pendingTokens[0] : null;
		},
		get gameMode() {
			return gameMode;
		},
		get remixMode() {
			return remixMode;
		},
		get remixChoices() {
			return remixChoices;
		},
		get status() {
			return status;
		},
		get error() {
			return error;
		},
		get model() {
			return model;
		},
		get prompt() {
			return prompt;
		},
		get timing() {
			return timing;
		},
		generate,
		stop,
		reset,
		revealNext,
		revealAll,
		revealWithChoice
	};
}
