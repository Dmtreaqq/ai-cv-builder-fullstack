import Anthropic from '@anthropic-ai/sdk';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { AiNotConfiguredError } from './ai-errors.js';

export const ANTHROPIC_CLIENT = Symbol('ANTHROPIC_CLIENT');
export const AI_MODEL = Symbol('AI_MODEL');

export const anthropicClientProvider: Provider = {
  provide: ANTHROPIC_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<EnvironmentVariables, true>): Anthropic | null => {
    const apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
    return apiKey ? new Anthropic({ apiKey, maxRetries: 2, timeout: 120_000 }) : null;
  },
};

export const aiModelProvider: Provider = {
  provide: AI_MODEL,
  inject: [ConfigService],
  useFactory: (config: ConfigService<EnvironmentVariables, true>): string =>
    config.get('ANTHROPIC_MODEL', { infer: true }),
};

export function requireClient(client: Anthropic | null): Anthropic {
  if (!client) {
    throw new AiNotConfiguredError();
  }
  return client;
}

// Sonnet 5.5 can decline in a few categories; the server retries those on another model.
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
