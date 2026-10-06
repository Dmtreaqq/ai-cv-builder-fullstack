import type Anthropic from '@anthropic-ai/sdk';
import { Inject, Injectable } from '@nestjs/common';
import { CV_LIMITS } from '../cvs/cv-limits.js';
import type { FieldRef } from '../cvs/cv-types.js';
import { AiOutputError } from './ai-errors.js';
import { AI_MODEL, ANTHROPIC_CLIENT, FALLBACK_BETA, requireClient } from './anthropic-client.js';
import { buildAnswerRequest } from './answer-prompt.js';
import type { AnswerInput } from './answer-prompt.js';

export type AppliedAnswer = { kind: 'text'; value: string } | { kind: 'skills'; skills: string[] };

const MAX_OUTPUT_TOKENS = 8_000;

@Injectable()
export class AnswerApplierService {
  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    @Inject(AI_MODEL) private readonly model: string,
  ) {}

  async apply(input: AnswerInput): Promise<AppliedAnswer> {
    const client = requireClient(this.client);
    const request = buildAnswerRequest(input);

    const message = await client.beta.messages.create({
      model: this.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: request.schema } },
      system: request.system,
      messages: request.messages,
    });

    if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
      throw new AiOutputError(`The answer could not be applied (${message.stop_reason}).`);
    }
    const output = message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('');
    return parseAnswer(output, input.target);
  }
}

export function parseAnswer(output: string, target: FieldRef): AppliedAnswer {
  let json: unknown;
  try {
    json = JSON.parse(output);
  } catch {
    throw new AiOutputError('The answer result was not valid JSON.');
  }
  const result = (json ?? {}) as { value?: unknown; skills?: unknown };

  if (target.section === 'skills') {
    if (!Array.isArray(result.skills) || !result.skills.every((s) => typeof s === 'string')) {
      throw new AiOutputError('The answer result had no skills list.');
    }
    const skills = (result.skills as string[])
      .map((skill) => skill.trim().slice(0, CV_LIMITS.skills.name))
      .filter(Boolean);
    return { kind: 'skills', skills };
  }

  if (typeof result.value !== 'string' || !result.value.trim()) {
    throw new AiOutputError('The answer result had no value.');
  }
  return { kind: 'text', value: result.value.trim().slice(0, fieldLimit(target)) };
}

export function fieldLimit(target: Exclude<FieldRef, { section: 'skills' }>): number {
  switch (target.section) {
    case 'contact':
      return CV_LIMITS.contact[target.field];
    case 'summary':
      return CV_LIMITS.summary;
    case 'experience':
      if ('bulletId' in target) {
        return CV_LIMITS.experience.bullet;
      }
      return target.field === 'start' || target.field === 'end'
        ? CV_LIMITS.experience.date
        : CV_LIMITS.experience[target.field];
    case 'education':
      return target.field === 'start' || target.field === 'end'
        ? CV_LIMITS.education.date
        : CV_LIMITS.education[target.field];
  }
}
