import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnswerQuestionDto } from './answer-question.dto.js';
import { CreateCvDto } from './create-cv.dto.js';

async function check<T extends object>(cls: new () => T, plain: Record<string, unknown>) {
  const dto = plainToInstance(cls, plain);
  const errors = await validate(dto);
  return {
    dto,
    messages: errors.flatMap((error) => Object.values(error.constraints ?? {})),
  };
}

describe('CreateCvDto', () => {
  it('trims the role and requires 2 to 100 characters', async () => {
    const ok = await check(CreateCvDto, { targetRole: '  Backend Engineer ' });
    const short = await check(CreateCvDto, { targetRole: 'B' });
    const long = await check(CreateCvDto, { targetRole: 'x'.repeat(101) });
    const empty = await check(CreateCvDto, { targetRole: '  ' });

    expect(ok.dto.targetRole).toBe('Backend Engineer');
    expect(ok.messages).toEqual([]);
    expect(short.messages).toEqual(['Keep the role between 2 and 100 characters.']);
    expect(long.messages).toEqual(['Keep the role between 2 and 100 characters.']);
    expect(empty.messages).toContain('Enter the role you’re applying for.');
  });

  it('strips control characters and treats blank text as missing', async () => {
    const cleaned = await check(CreateCvDto, {
      targetRole: 'Dev',
      sourceText: ' Line one\u0000\u0007\nLine\ttwo ',
    });
    const blank = await check(CreateCvDto, { targetRole: 'Dev', sourceText: ' \u0000 ' });

    expect(cleaned.dto.sourceText).toBe('Line one\nLine\ttwo');
    expect(blank.dto.sourceText).toBeUndefined();
    expect(blank.messages).toEqual([]);
  });

  it('limits the text to 30,000 characters', async () => {
    const { messages } = await check(CreateCvDto, {
      targetRole: 'Dev',
      sourceText: 'x'.repeat(30_001),
    });

    expect(messages).toEqual(['Keep your background under 30,000 characters.']);
  });
});

describe('AnswerQuestionDto', () => {
  it('trims the answer and requires 1 to 1,000 characters', async () => {
    const ok = await check(AnswerQuestionDto, { answer: '  2016 ' });
    const empty = await check(AnswerQuestionDto, { answer: '   ' });
    const long = await check(AnswerQuestionDto, { answer: 'x'.repeat(1_001) });

    expect(ok.dto.answer).toBe('2016');
    expect(empty.messages).toEqual(['Enter an answer, or skip the question.']);
    expect(long.messages).toEqual(['Keep your answer under 1,000 characters.']);
  });
});
