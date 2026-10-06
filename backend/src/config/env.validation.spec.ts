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

  it('defaults REDIS_URL and accepts redis urls only', () => {
    expect(validate(REQUIRED).REDIS_URL).toBe('redis://localhost:6379');
    expect(validate({ ...REQUIRED, REDIS_URL: 'rediss://cache:6380' }).REDIS_URL).toBe(
      'rediss://cache:6380',
    );
    expect(() => validate({ ...REQUIRED, REDIS_URL: 'http://cache' })).toThrow(/REDIS_URL/);
  });

  it('boots without an Anthropic key and defaults the model', () => {
    const env = validate(REQUIRED);

    expect(env.ANTHROPIC_API_KEY).toBe('');
    expect(env.ANTHROPIC_MODEL).toBe('claude-sonnet-5-5');
    expect(validate({ ...REQUIRED, ANTHROPIC_MODEL: 'claude-opus-5-5' }).ANTHROPIC_MODEL).toBe(
      'claude-opus-5-5',
    );
  });
});
