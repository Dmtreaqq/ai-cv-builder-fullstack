import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type Anthropic from '@anthropic-ai/sdk';
import { AiNotConfiguredError, AiOutputError } from './ai-errors.js';
import { InvalidDraftError } from './cv-draft.js';
import { CV_DRAFT_SCHEMA } from './cv-draft.schema.js';
import { CvGeneratorService } from './cv-generator.service.js';

const DRAFT = {
  contact: {
    fullName: 'Jordan Lee',
    headline: 'Backend Engineer',
    email: '',
    phone: '',
    location: 'Berlin',
    links: [],
  },
  summary: 'Backend engineer.',
  experience: [
    {
      role: 'Engineer',
      company: 'Acme',
      location: '',
      start: '2021',
      end: '',
      bullets: ['Built X.'],
    },
  ],
  education: [],
  skills: ['Go'],
  questions: [],
};

type StopReason = 'end_turn' | 'refusal' | 'max_tokens';

function fakeStream(text: string, stopReason: StopReason = 'end_turn') {
  const cut = Math.floor(text.length / 2);
  const events = [
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
    ...[text.slice(0, cut), text.slice(cut)].map((chunk) => ({
      type: 'content_block_delta',
      index: 1,
      delta: { type: 'text_delta', text: chunk },
    })),
  ];
  return {
    async *[Symbol.asyncIterator]() {
      yield* events;
    },
    finalMessage: async () => ({
      stop_reason: stopReason,
      content: [
        { type: 'thinking', thinking: '' },
        { type: 'text', text },
      ],
    }),
  };
}

describe('CvGeneratorService', () => {
  const stream = jest.fn<(params: Record<string, unknown>) => ReturnType<typeof fakeStream>>();
  const client = { beta: { messages: { stream } } } as unknown as Anthropic;
  const input = { targetRole: 'Backend Engineer', sourceText: 'Eight years.', sourcePdf: null };
  let stages: string[];
  const onStage = (stage: string) => stages.push(stage);

  beforeEach(() => {
    stream.mockReset();
    stages = [];
  });

  it('streams with structured output and returns the parsed draft', async () => {
    stream.mockReturnValue(fakeStream(JSON.stringify(DRAFT)));
    const service = new CvGeneratorService(client, 'claude-sonnet-5-5');

    const draft = await service.generate(input, onStage);

    expect(draft.contact.fullName).toBe('Jordan Lee');
    expect(draft.experience[0].bullets).toEqual(['Built X.']);
    expect(stream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-5-5',
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: CV_DRAFT_SCHEMA },
        },
      }),
    );
  });

  it('reports real milestones while streaming', async () => {
    stream.mockReturnValue(fakeStream(JSON.stringify(DRAFT)));

    await new CvGeneratorService(client, 'model').generate(input, onStage);

    expect(stages).toEqual(['analyzing', 'drafting', 'tailoring', 'reviewing']);
  });

  it('treats a refusal as permanent', async () => {
    stream.mockReturnValue(fakeStream('{"contact":', 'refusal'));

    await expect(new CvGeneratorService(client, 'model').generate(input, onStage)).rejects.toThrow(
      AiOutputError,
    );
  });

  it('treats a cut-off draft as permanent', async () => {
    stream.mockReturnValue(fakeStream('{"contact":', 'max_tokens'));

    await expect(new CvGeneratorService(client, 'model').generate(input, onStage)).rejects.toThrow(
      AiOutputError,
    );
  });

  it('retries an invalid draft once within the call', async () => {
    stream
      .mockReturnValueOnce(fakeStream('not json'))
      .mockReturnValueOnce(fakeStream(JSON.stringify(DRAFT)));

    const draft = await new CvGeneratorService(client, 'model').generate(input, onStage);

    expect(stream).toHaveBeenCalledTimes(2);
    expect(draft.summary).toBe('Backend engineer.');
  });

  it('gives up after the second invalid draft', async () => {
    stream
      .mockReturnValueOnce(fakeStream('not json'))
      .mockReturnValueOnce(fakeStream(JSON.stringify({ ...DRAFT, skills: 'Go' })));

    await expect(new CvGeneratorService(client, 'model').generate(input, onStage)).rejects.toThrow(
      InvalidDraftError,
    );
    expect(stream).toHaveBeenCalledTimes(2);
  });

  it('raises not-configured without a client', async () => {
    await expect(new CvGeneratorService(null, 'model').generate(input, onStage)).rejects.toThrow(
      AiNotConfiguredError,
    );
  });
});
