import { describe, expect, it } from '@jest/globals';
import { validate } from './env.validation.js';

const REQUIRED = {
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/ai_cv_builder',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validate (env)', () => {
  it('throws when DATABASE_URL is missing', () => {
    expect(() => validate({ JWT_SECRET: REQUIRED.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('defaults PORT to 3000', () => {
    expect(validate(REQUIRED).PORT).toBe(3000);
  });

  it('parses PORT from a string', () => {
    expect(validate({ ...REQUIRED, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validate({ ...REQUIRED, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('requires a JWT_SECRET of at least 32 characters', () => {
    expect(() => validate({ DATABASE_URL: REQUIRED.DATABASE_URL })).toThrow(/JWT_SECRET/);
    expect(() => validate({ ...REQUIRED, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('defaults NODE_ENV to development and rejects unknown values', () => {
    expect(validate(REQUIRED).NODE_ENV).toBe('development');
    expect(validate({ ...REQUIRED, NODE_ENV: 'production' }).NODE_ENV).toBe('production');
    expect(() => validate({ ...REQUIRED, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
