import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type Anthropic from '@anthropic-ai/sdk';
import type { CvContent, FieldRef } from '../cvs/cv-types.js';
import { AiNotConfiguredError, AiOutputError } from './ai-errors.js';
import { AnswerApplierService } from './answer-applier.service.js';
import { SKILLS_ANSWER_SCHEMA, TEXT_ANSWER_SCHEMA } from './answer-prompt.js';

const content: CvContent = {
  contact: { fullName: 'Jordan', headline: '', email: '', phone: '', location: '', links: [] },
  summary: 'Engineer.',
  experience: [
    {
      id: 'exp-acme',
      role: 'Engineer',
      company: 'Acme',
      location: '',
      start: '2021',
      end: '',
      bullets: [{ id: 'bullet-perf', text: 'Improved API performance.' }],
    },
  ],
  education: [],
  skills: [{ id: 's1', name: 'Go' }],
};

const bulletTarget: FieldRef = {
  section: 'experience',
  entryId: 'exp-acme',
  bulletId: 'bullet-perf',
};

function reply(text: string, stopReason = 'end_turn') {
  return { stop_reason: stopReason, content: [{ type: 'text', text }] };
}

describe('AnswerApplierService', () => {
  const create = jest.fn<(params: Record<string, unknown>) => Promise<ReturnType<typeof reply>>>();
  const client = { beta: { messages: { create } } } as unknown as Anthropic;
  const service = new AnswerApplierService(client, 'claude-sonnet-5-5');

  beforeEach(() => create.mockReset());

  it('rewrites a bullet with low effort and the answer wrapped in tags', async () => {
    create.mockResolvedValue(reply('{"value":"Cut p95 latency from 800 ms to 120 ms."}'));

    const result = await service.apply({
      targetRole: 'Backend Engineer',
      question: 'How much faster?',
      answer: 'p95 went from 800ms to 120ms',
      target: bulletTarget,
      content,
    });

    expect(result).toEqual({ kind: 'text', value: 'Cut p95 latency from 800 ms to 120 ms.' });
    const params = create.mock.calls[0][0] as {
      output_config: unknown;
      messages: { content: string }[];
    };
    expect(params.output_config).toEqual({
      effort: 'low',
      format: { type: 'json_schema', schema: TEXT_ANSWER_SCHEMA },
    });
    expect(params.messages[0].content).toContain('<answer>p95 went from 800ms to 120ms</answer>');
    expect(params.messages[0].content).toContain(
      '<current_value>Improved API performance.</current_value>',
    );
    expect(params.messages[0].content).toContain('an achievement bullet for Engineer at Acme');
  });

  it('returns new skills with the skills schema', async () => {
    create.mockResolvedValue(reply('{"skills":[" PostgreSQL ","Redis",""]}'));

    const result = await service.apply({
      targetRole: 'Backend Engineer',
      question: 'Which databases?',
      answer: 'postgres and redis',
      target: { section: 'skills' },
      content,
    });

    expect(result).toEqual({ kind: 'skills', skills: ['PostgreSQL', 'Redis'] });
    expect(create.mock.calls[0][0]).toMatchObject({
      output_config: { format: { schema: SKILLS_ANSWER_SCHEMA } },
    });
  });

  it('caps the value to the field limit', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ value: '1'.repeat(200) })));

    const result = await service.apply({
      targetRole: 'Dev',
      question: 'Phone?',
      answer: '1',
      target: { section: 'contact', field: 'phone' },
      content,
    });

    expect(result).toEqual({ kind: 'text', value: '1'.repeat(50) });
  });

  it.each([
    ['a refusal', reply('', 'refusal')],
    ['invalid JSON', reply('nope')],
    ['an empty value', reply('{"value":"  "}')],
  ])('treats %s as an output error', async (_label, response) => {
    create.mockResolvedValue(response);

    await expect(
      service.apply({
        targetRole: 'Dev',
        question: 'Q',
        answer: 'A',
        target: bulletTarget,
        content,
      }),
    ).rejects.toThrow(AiOutputError);
  });

  it('raises not-configured without a client', async () => {
    await expect(
      new AnswerApplierService(null, 'model').apply({
        targetRole: 'Dev',
        question: 'Q',
        answer: 'A',
        target: bulletTarget,
        content,
      }),
    ).rejects.toThrow(AiNotConfiguredError);
  });
});
