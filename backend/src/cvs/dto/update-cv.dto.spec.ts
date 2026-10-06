import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CV_LIMITS } from '../cv-limits.js';
import { UpdateCvDto } from './update-cv.dto.js';

// Mirrors the global ValidationPipe options.
async function errorPaths(plain: Record<string, unknown>) {
  const errors = await validate(plainToInstance(UpdateCvDto, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const paths: string[] = [];
  const walk = (list: typeof errors, prefix: string) => {
    for (const error of list) {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      if (error.constraints) {
        paths.push(path);
      }
      walk(error.children ?? [], path);
    }
  };
  walk(errors, '');
  return paths;
}

function content(overrides: Record<string, unknown> = {}) {
  return {
    contact: { fullName: 'A', headline: '', email: '', phone: '', location: '', links: [] },
    summary: '',
    experience: [
      {
        id: 'exp-1',
        role: '',
        company: '',
        location: '',
        start: '',
        end: '',
        bullets: [{ id: 'b-1', text: 'Did things.' }],
      },
    ],
    education: [],
    skills: [{ id: 's-1', name: 'Go' }],
    ...overrides,
  };
}

describe('UpdateCvDto', () => {
  it('accepts a title, valid content, or both', async () => {
    expect(await errorPaths({ title: 'Mine' })).toEqual([]);
    expect(await errorPaths({ content: content() })).toEqual([]);
    expect(await errorPaths({})).toEqual([]);
  });

  it('trims the title and rejects empty or long titles', async () => {
    const dto = plainToInstance(UpdateCvDto, { title: '  Mine  ' });

    expect(dto.title).toBe('Mine');
    expect(await errorPaths({ title: '   ' })).toEqual(['title']);
    expect(await errorPaths({ title: 'x'.repeat(CV_LIMITS.title + 1) })).toEqual(['title']);
  });

  it('rejects unknown keys at any depth', async () => {
    expect(await errorPaths({ owner: 'me' })).toEqual(['owner']);
    expect(await errorPaths({ content: content({ photo: 'x' }) })).toEqual(['content.photo']);
    expect(
      await errorPaths({
        content: content({ skills: [{ id: 's', name: 'Go', level: 5 }] }),
      }),
    ).toEqual(['content.skills.0.level']);
  });

  it('caps array sizes', async () => {
    const bullets = Array.from({ length: CV_LIMITS.experience.bullets + 1 }, (_, i) => ({
      id: `b${i}`,
      text: 'x',
    }));
    const skills = Array.from({ length: CV_LIMITS.skills.entries + 1 }, (_, i) => ({
      id: `s${i}`,
      name: 'x',
    }));
    const experience = [{ ...content().experience[0], bullets }];

    expect(await errorPaths({ content: content({ experience }) })).toEqual([
      'content.experience.0.bullets',
    ]);
    expect(await errorPaths({ content: content({ skills }) })).toEqual(['content.skills']);
  });

  it('caps string lengths and id lengths', async () => {
    expect(
      await errorPaths({ content: content({ summary: 'x'.repeat(CV_LIMITS.summary + 1) }) }),
    ).toEqual(['content.summary']);
    expect(
      await errorPaths({ content: content({ skills: [{ id: 'x'.repeat(65), name: 'Go' }] }) }),
    ).toEqual(['content.skills.0.id']);
  });

  it('requires every section', async () => {
    const { contact: _contact, ...withoutContact } = content();

    expect(await errorPaths({ content: withoutContact })).toContain('content.contact');
  });
});
