import Anthropic from '@anthropic-ai/sdk';

export const AI_NOT_CONFIGURED_MESSAGE = 'AI generation is not configured.';

export class AiNotConfiguredError extends Error {
  constructor() {
    super(AI_NOT_CONFIGURED_MESSAGE);
    this.name = 'AiNotConfiguredError';
  }
}

// The model answered, but not with something we can use (refusal, cut off, invalid JSON).
export class AiOutputError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'AiOutputError';
  }
}

export type AiErrorKind = 'transient' | 'permanent' | 'not-configured';

export function classifyAiError(error: unknown): AiErrorKind {
  if (
    error instanceof AiNotConfiguredError ||
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return 'not-configured';
  }
  if (
    error instanceof Anthropic.RateLimitError ||
    error instanceof Anthropic.InternalServerError ||
    error instanceof Anthropic.ConflictError ||
    error instanceof Anthropic.APIConnectionError
  ) {
    return 'transient';
  }
  return 'permanent';
}

const SAFE_MESSAGES: Record<AiErrorKind, string> = {
  'not-configured': AI_NOT_CONFIGURED_MESSAGE,
  transient: 'The AI service is busy right now. Try again in a few minutes.',
  permanent: 'We couldn’t write a CV from this background. Try again, or add more detail.',
};

export function safeMessage(kind: AiErrorKind): string {
  return SAFE_MESSAGES[kind];
}
