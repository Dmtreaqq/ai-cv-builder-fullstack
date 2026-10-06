import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthUser } from '../auth/auth-user.js';

export const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests, try again later.';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = (req.user as AuthUser | undefined)?.id;
    return userId ? `user:${userId}` : `ip:${await super.getTracker(req)}`;
  }

  // One budget per limit name, shared by every route tagged with it (e.g. create + retry).
  protected override generateKey(_context: unknown, tracker: string, name: string): string {
    return `${name}:${tracker}`;
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: TOO_MANY_REQUESTS_MESSAGE,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
