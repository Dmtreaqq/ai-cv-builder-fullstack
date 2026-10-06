import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(CreateUserDto, plain);
  const errors = await validate(dto);
  return { dto, fields: errors.map((error) => error.property) };
}

describe('CreateUserDto', () => {
  it('trims and lowercases the email', async () => {
    const { dto, fields } = await validateDto({ email: '  Ada@Example.COM ', password: 'secret' });

    expect(fields).toEqual([]);
    expect(dto.email).toBe('ada@example.com');
  });

  it('rejects an invalid email', async () => {
    const { fields } = await validateDto({ email: 'not-an-email', password: 'secret' });

    expect(fields).toEqual(['email']);
  });

  it('rejects an empty password', async () => {
    const { fields } = await validateDto({ email: 'ada@example.com', password: '' });

    expect(fields).toEqual(['password']);
  });

  it('allows the name to be omitted', async () => {
    const { dto, fields } = await validateDto({ email: 'ada@example.com', password: 'secret' });

    expect(fields).toEqual([]);
    expect(dto.name).toBeUndefined();
  });

  it('trims the name and rejects names over 100 characters', async () => {
    const trimmed = await validateDto({ email: 'a@b.co', password: 'x', name: '  Ada  ' });
    const tooLong = await validateDto({ email: 'a@b.co', password: 'x', name: 'a'.repeat(101) });

    expect(trimmed.dto.name).toBe('Ada');
    expect(tooLong.fields).toEqual(['name']);
  });
});
