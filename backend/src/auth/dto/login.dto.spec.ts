import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto.js';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(LoginDto, plain);
  const errors = await validate(dto);
  return { dto, fields: errors.map((error) => error.property) };
}

describe('LoginDto', () => {
  it('trims and lowercases the email', async () => {
    const { dto, fields } = await validateDto({ email: ' Ada@Example.com ', password: 'x' });

    expect(fields).toEqual([]);
    expect(dto.email).toBe('ada@example.com');
  });

  it('rejects an invalid email', async () => {
    const { fields } = await validateDto({ email: 'nope', password: 'x' });

    expect(fields).toEqual(['email']);
  });

  it('only requires a non-empty password', async () => {
    const empty = await validateDto({ email: 'ada@example.com', password: '' });
    const short = await validateDto({ email: 'ada@example.com', password: 'x' });

    expect(empty.fields).toEqual(['password']);
    expect(short.fields).toEqual([]);
  });
});
