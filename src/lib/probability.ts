import type { TokenCandidate } from './types.js';

/** Convert log probability to probability (0-1) */
export function logprobToProb(logprob: number): number {
	return Math.exp(logprob);
}

/** Normalize probabilities across visible candidates to sum to 1.0 */
export function normalizeTopLogprobs(
	candidates: Array<{ token: string; logprob: number; bytes: number[] }>
): TokenCandidate[] {
	const rawProbs = candidates.map((c) => Math.exp(c.logprob));
	const sum = rawProbs.reduce((a, b) => a + b, 0);
	return candidates.map((c, i) => ({
		token: c.token,
		logprob: c.logprob,
		probability: sum > 0 ? rawProbs[i] / sum : 0,
		bytes: c.bytes
	}));
}

/** Get a CSS color for a probability value (0-1) using the design palette */
export function probabilityColor(probability: number): string {
	if (probability > 0.3) return 'var(--pv-prob-high)';
	if (probability > 0.1) return 'var(--pv-prob-mid)';
	return 'var(--pv-prob-low)';
}

/** Get a human-readable confidence label */
export function confidenceLabel(probability: number): string {
	if (probability > 0.7) return 'Very confident';
	if (probability > 0.3) return 'Fairly sure';
	if (probability > 0.1) return 'Considering options';
	return 'Surprised!';
}

/** Format probability as percentage string */
export function formatProbability(probability: number): string {
	const pct = probability * 100;
	if (pct >= 10) return `${Math.round(pct)}%`;
	if (pct >= 1) return `${pct.toFixed(1)}%`;
	return `${pct.toFixed(2)}%`;
}
