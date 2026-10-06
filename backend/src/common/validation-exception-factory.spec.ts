import { describe, expect, it } from '@jest/globals';
import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception-factory.js';

function fieldError(property: string, constraints: Record<string, string>): ValidationError {
  return { property, constraints, children: [] };
}

describe('validationExceptionFactory', () => {
  it('uses the first message as a string and maps errors by field', () => {
    const exception = validationExceptionFactory([
      fieldError('email', { isEmail: 'Enter a valid email address.' }),
      fieldError('password', {
        isString: 'password must be a string',
        isNotEmpty: 'Password is required.',
      }),
    ]);

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      statusCode: 400,
      message: 'Enter a valid email address.',
      error: 'Bad Request',
      errors: {
        email: ['Enter a valid email address.'],
        password: ['password must be a string', 'Password is required.'],
      },
    });
  });

  it('uses dotted paths for nested errors', () => {
    const exception = validationExceptionFactory([
      {
        property: 'profile',
        children: [fieldError('name', { isString: 'name must be a string' })],
      },
    ]);

    expect(exception.getResponse()).toMatchObject({
      message: 'name must be a string',
      errors: { 'profile.name': ['name must be a string'] },
    });
  });
});
