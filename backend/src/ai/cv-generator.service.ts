import type Anthropic from '@anthropic-ai/sdk';
import { Inject, Injectable } from '@nestjs/common';
import type { StageId } from '../cvs/cv-types.js';
import { AiOutputError } from './ai-errors.js';
import { AI_MODEL, ANTHROPIC_CLIENT, FALLBACK_BETA, requireClient } from './anthropic-client.js';
import { InvalidDraftError, parseDraft } from './cv-draft.js';
import type { CvDraft } from './cv-draft.js';
import { CV_DRAFT_SCHEMA } from './cv-draft.schema.js';
import { buildGenerationRequest } from './cv-generation-prompt.js';
import type { GenerationInput, GenerationRequest } from './cv-generation-prompt.js';

export const MAX_DRAFT_ATTEMPTS = 2;
const MAX_OUTPUT_TOKENS = 32_000;

export type StageListener = (stage: StageId) => void;

@Injectable()
export class CvGeneratorService {
  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    @Inject(AI_MODEL) private readonly model: string,
  ) {}

  async generate(input: GenerationInput, onStage: StageListener): Promise<CvDraft> {
    const client = requireClient(this.client);
    const request = buildGenerationRequest(input);

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.requestDraft(client, request, onStage);
      } catch (error) {
        if (error instanceof InvalidDraftError && attempt < MAX_DRAFT_ATTEMPTS) {
          continue;
        }
        throw error;
      }
    }
  }

  private async requestDraft(
    client: Anthropic,
    request: GenerationRequest,
    onStage: StageListener,
  ): Promise<CvDraft> {
    onStage('analyzing');
    const stream = client.beta.messages.stream({
      model: this.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: CV_DRAFT_SCHEMA },
      },
      system: request.system,
      messages: request.messages,
    });

    let streamed = '';
    let tailoring = false;
    for await (const event of stream) {
      if (event.type !== 'content_block_delta' || event.delta.type !== 'text_delta') {
        continue;
      }
      if (!streamed) {
        onStage('drafting');
      }
      streamed += event.delta.text;
      if (!tailoring && streamed.includes('"experience"')) {
        tailoring = true;
        onStage('tailoring');
      }
    }

    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') {
      throw new AiOutputError('The model declined to write this CV.');
    }
    if (message.stop_reason === 'max_tokens') {
      throw new AiOutputError('The CV draft was cut off.');
    }

    onStage('reviewing');
    const output = message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('');
    let json: unknown;
    try {
      json = JSON.parse(output);
    } catch {
      throw new InvalidDraftError('not valid JSON');
    }
    return parseDraft(json);
  }
}
