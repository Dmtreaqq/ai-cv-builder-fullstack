import type { Question } from '@/features/cvs/cv-types';
import { readText } from '@/features/cvs/field-ref';
import { buildCvContent } from './persona';
import { applyAnswer, buildQuestions } from './questions';

const content = buildCvContent('Staff Engineer');
const questions = buildQuestions(content);

function question(id: string): Question {
  const found = questions.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing question ${id}`);
  }
  return found;
}

describe('applyAnswer', () => {
  it('sets a plain field to the trimmed answer', () => {
    const next = applyAnswer(content, question('q-phone'), '  +49 151 2345 6789 ');
    expect(next.contact.phone).toBe('+49 151 2345 6789');
  });

  it('extends the vague bullet with the metric', () => {
    const target = question('q-api-metric');
    const next = applyAnswer(content, target, 'cutting p95 latency from 800 ms to 120 ms.');
    expect(readText(next, target.target)).toBe(
      'Improved API performance, cutting p95 latency from 800 ms to 120 ms.',
    );
  });

  it('builds on the current bullet text, not the original', () => {
    const target = question('q-api-metric');
    const edited = applyAnswer(content, { ...target, id: 'x' }, 'by 3x');
    expect(readText(applyAnswer(edited, target, 'p95 down to 120 ms'), target.target)).toBe(
      'Improved API performance, by 3x, p95 down to 120 ms.',
    );
  });

  it('adds only new databases to skills', () => {
    const next = applyAnswer(content, question('q-databases'), 'PostgreSQL, redis, , Redis, go');
    const added = next.skills.slice(content.skills.length).map((skill) => skill.name);
    expect(added).toEqual(['PostgreSQL', 'redis']);
  });
});
