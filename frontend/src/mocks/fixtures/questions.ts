import type { CvContent, Question } from '@/features/cvs/cv-types';
import { readText, writeText } from '@/features/cvs/field-ref';
import { createId } from '@/lib/create-id';
import { PERSONA_IDS } from './persona';

const DATABASE_PATTERN = /postgres|mysql|mongo|redis|dynamo|sqlite|oracle|cassandra|sql server/i;

export function buildQuestions(content: CvContent): Question[] {
  const questions: Question[] = [];
  const previousJob = content.experience.find((entry) => entry.id === PERSONA_IDS.previousJob);
  const degree = content.education.find((entry) => entry.id === PERSONA_IDS.degree);

  if (!content.contact.phone) {
    questions.push({
      id: 'q-phone',
      prompt: 'What phone number should recruiters use?',
      hint: 'Include the country code, e.g. +49 151 2345 6789',
      target: { section: 'contact', field: 'phone' },
      status: 'open',
    });
  }
  if (previousJob && !previousJob.end) {
    questions.push({
      id: 'q-previous-job-end',
      prompt: `When did you leave ${previousJob.company}?`,
      hint: 'e.g. Aug 2022',
      target: { section: 'experience', entryId: previousJob.id, field: 'end' },
      status: 'open',
    });
  }
  questions.push({
    id: 'q-api-metric',
    prompt: 'How much did API performance improve, and on which metric?',
    hint: 'e.g. cutting p95 latency from 800 ms to 120 ms',
    target: {
      section: 'experience',
      entryId: PERSONA_IDS.currentJob,
      bulletId: PERSONA_IDS.vagueBullet,
    },
    status: 'open',
  });
  if (degree && !degree.end) {
    questions.push({
      id: 'q-graduation-year',
      prompt: 'What year did you graduate?',
      hint: 'e.g. 2016',
      target: { section: 'education', entryId: degree.id, field: 'end' },
      status: 'open',
    });
  }
  if (!content.skills.some((skill) => DATABASE_PATTERN.test(skill.name))) {
    questions.push({
      id: 'q-databases',
      prompt: 'Which databases have you used in production?',
      hint: 'Separate them with commas, e.g. PostgreSQL, Redis',
      target: { section: 'skills' },
      status: 'open',
    });
  }
  return questions;
}

function stripTrailingPeriod(text: string) {
  return text.trim().replace(/[.\s]+$/, '');
}

export function applyAnswer(content: CvContent, question: Question, answer: string): CvContent {
  const value = answer.trim();
  const { target } = question;

  if (target.section === 'skills') {
    const existing = new Set(content.skills.map((skill) => skill.name.toLowerCase()));
    const added = value
      .split(',')
      .map((name) => name.trim())
      .filter((name) => {
        const key = name.toLowerCase();
        if (!name || existing.has(key)) {
          return false;
        }
        existing.add(key);
        return true;
      })
      .map((name) => ({ id: createId(), name }));
    return { ...content, skills: [...content.skills, ...added] };
  }

  if (target.section === 'experience' && 'bulletId' in target) {
    const current = stripTrailingPeriod(readText(content, target) ?? '');
    return writeText(content, target, `${current}, ${stripTrailingPeriod(value)}.`);
  }

  return writeText(content, target, value);
}
