import { describe, expect, it } from '@jest/globals';
import { validate } from './env.validation.js';

const DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/ai_cv_builder';

describe('validate (env)', () => {
  it('throws when DATABASE_URL is missing', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
  });

  it('defaults PORT to 3000', () => {
    expect(validate({ DATABASE_URL }).PORT).toBe(3000);
  });

  it('parses PORT from a string', () => {
    expect(validate({ DATABASE_URL, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validate({ DATABASE_URL, PORT: 'abc' })).toThrow(/PORT/);
  });
});
