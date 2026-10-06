import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export type ValidationErrorMap = Record<string, string[]>;

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const fieldErrors = collectFieldErrors(errors);
  const message = Object.values(fieldErrors)[0]?.[0] ?? 'Validation failed';

  return new BadRequestException({
    statusCode: 400,
    message,
    error: 'Bad Request',
    errors: fieldErrors,
  });
}

function collectFieldErrors(errors: ValidationError[], parentPath = ''): ValidationErrorMap {
  const result: ValidationErrorMap = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});
    if (messages.length > 0) {
      result[path] = messages;
    }
    Object.assign(result, collectFieldErrors(error.children ?? [], path));
  }

  return result;
}
