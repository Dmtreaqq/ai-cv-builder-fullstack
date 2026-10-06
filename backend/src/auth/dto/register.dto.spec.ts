import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

const PASSWORD = 'correct-horse';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(RegisterDto, plain);
  const errors = await validate(dto);
  return {
    dto,
    fields: errors.map((error) => error.property),
    messages: errors.flatMap((error) => Object.values(error.constraints ?? {})),
  };
}

describe('RegisterDto', () => {
  it('trims and lowercases the email', async () => {
    const { dto, fields } = await validateDto({ email: '  Ada@Example.COM ', password: PASSWORD });

    expect(fields).toEqual([]);
    expect(dto.email).toBe('ada@example.com');
  });

  it('rejects an invalid email', async () => {
    const { fields } = await validateDto({ email: 'not-an-email', password: PASSWORD });

    expect(fields).toEqual(['email']);
  });

  it('rejects an empty password', async () => {
    const { fields } = await validateDto({ email: 'ada@example.com', password: '' });

    expect(fields).toEqual(['password']);
  });

  it('requires 8 to 72 characters in the password', async () => {
    const short = await validateDto({ email: 'ada@example.com', password: 'a'.repeat(7) });
    const long = await validateDto({ email: 'ada@example.com', password: 'a'.repeat(73) });
    const edges = await Promise.all([
      validateDto({ email: 'ada@example.com', password: 'a'.repeat(8) }),
      validateDto({ email: 'ada@example.com', password: 'a'.repeat(72) }),
    ]);

    expect(short.messages).toEqual(['Password must be at least 8 characters.']);
    expect(long.messages).toEqual(['Password must be at most 72 characters.']);
    expect(edges.map((result) => result.fields)).toEqual([[], []]);
  });

  it('allows the name to be omitted', async () => {
    const { dto, fields } = await validateDto({ email: 'ada@example.com', password: PASSWORD });

    expect(fields).toEqual([]);
    expect(dto.name).toBeUndefined();
  });

  it('trims the name and rejects names over 100 characters', async () => {
    const trimmed = await validateDto({ email: 'a@b.co', password: PASSWORD, name: '  Ada  ' });
    const tooLong = await validateDto({
      email: 'a@b.co',
      password: PASSWORD,
      name: 'a'.repeat(101),
    });

    expect(trimmed.dto.name).toBe('Ada');
    expect(tooLong.fields).toEqual(['name']);
  });
});
