import { describe, expect, it } from '@jest/globals';
import Anthropic from '@anthropic-ai/sdk';
import {
  AI_NOT_CONFIGURED_MESSAGE,
  AiNotConfiguredError,
  AiOutputError,
  classifyAiError,
  safeMessage,
} from './ai-errors.js';

function apiError(status: number) {
  return Anthropic.APIError.generate(
    status,
    { error: { message: 'secret upstream detail' } },
    undefined,
    new Headers(),
  );
}

describe('classifyAiError', () => {
  it.each([429, 500, 529, 409])('treats HTTP %i as transient', (status) => {
    expect(classifyAiError(apiError(status))).toBe('transient');
  });

  it('treats connection problems and timeouts as transient', () => {
    expect(classifyAiError(new Anthropic.APIConnectionError({ message: 'reset' }))).toBe(
      'transient',
    );
    expect(classifyAiError(new Anthropic.APIConnectionTimeoutError())).toBe('transient');
  });

  it.each([400, 404, 413])('treats HTTP %i as permanent', (status) => {
    expect(classifyAiError(apiError(status))).toBe('permanent');
  });

  it('treats bad output and unknown errors as permanent', () => {
    expect(classifyAiError(new AiOutputError('refusal'))).toBe('permanent');
    expect(classifyAiError(new TypeError('bug'))).toBe('permanent');
  });

  it('reports a missing or rejected key as not configured', () => {
    expect(classifyAiError(new AiNotConfiguredError())).toBe('not-configured');
    expect(classifyAiError(apiError(401))).toBe('not-configured');
    expect(classifyAiError(apiError(403))).toBe('not-configured');
  });
});

describe('safeMessage', () => {
  it('never echoes upstream details', () => {
    for (const kind of ['transient', 'permanent', 'not-configured'] as const) {
      expect(safeMessage(kind)).not.toContain('secret');
    }
    expect(safeMessage('not-configured')).toBe(AI_NOT_CONFIGURED_MESSAGE);
  });
});
