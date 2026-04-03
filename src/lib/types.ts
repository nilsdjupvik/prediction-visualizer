/** A single candidate token with its probability */
export interface TokenCandidate {
	token: string;
	logprob: number;
	probability: number;
	bytes: number[];
}

/** One step in the generation — the chosen token + alternatives */
export interface TokenEvent {
	index: number;
	chosen: TokenCandidate;
	alternatives: TokenCandidate[];
	timestamp: number;
	isThinking: boolean;
}

/** User-configurable generation parameters */
export interface GenerationParameters {
	temperature: number;
	topK: number;
	topP: number;
	numPredict: number;
	topLogprobs: number;
	repeatPenalty: number;
	repeatLastN: number;
}

/** The full generation session */
export interface GenerationSession {
	id: string;
	prompt: string;
	model: string;
	tokens: TokenEvent[];
	status: 'idle' | 'generating' | 'complete' | 'error';
	error?: string;
	parameters: GenerationParameters;
	timing?: {
		totalDuration: number;
		evalCount: number;
		evalDuration: number;
		tokensPerSecond: number;
	};
}

/** Ollama model info from /api/tags */
export interface OllamaModel {
	name: string;
	size: number;
	digest: string;
	modified_at: string;
}

export const DEFAULT_PARAMETERS: GenerationParameters = {
	temperature: 0.8,
	topK: 40,
	topP: 0.9,
	numPredict: 100,
	topLogprobs: 10,
	repeatPenalty: 1.1,
	repeatLastN: 64
};

export type DifficultyLevel = 'kids' | 'curious' | 'advanced';
