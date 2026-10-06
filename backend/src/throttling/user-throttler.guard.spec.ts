import { beforeEach, describe, expect, it } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { RateLimit } from './rate-limit.decorator.js';
import { buildThrottlers } from './rate-limits.js';
import { TOO_MANY_REQUESTS_MESSAGE, UserThrottlerGuard } from './user-throttler.guard.js';

class TestController {
  @RateLimit('auth')
  login() {}

  @RateLimit('generation')
  create() {}

  @RateLimit('generation')
  retry() {}

  list() {}
}

type Handler = 'login' | 'create' | 'retry' | 'list';

function contextFor(handler: Handler, request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ header: () => undefined }),
    }),
  } as unknown as ExecutionContext;
}

async function hit(guard: UserThrottlerGuard, handler: Handler, request: object, times: number) {
  for (let i = 0; i < times; i++) {
    await guard.canActivate(contextFor(handler, { ...request }));
  }
}

describe('UserThrottlerGuard', () => {
  let guard: UserThrottlerGuard;

  beforeEach(async () => {
    guard = new UserThrottlerGuard(
      { throttlers: buildThrottlers() },
      new ThrottlerStorageService(),
      new Reflector(),
    );
    await guard.onModuleInit();
  });

  it('does not limit routes without @RateLimit', async () => {
    await expect(hit(guard, 'list', { ip: '1.1.1.1' }, 50)).resolves.toBeUndefined();
  });

  it('limits auth routes per IP with a string message', async () => {
    await hit(guard, 'login', { ip: '1.1.1.1' }, 10);

    const blocked = guard.canActivate(contextFor('login', { ip: '1.1.1.1' }));
    await expect(blocked).rejects.toThrow(HttpException);
    await expect(blocked).rejects.toMatchObject({
      response: { statusCode: 429, message: TOO_MANY_REQUESTS_MESSAGE, error: 'Too Many Requests' },
    });
    await expect(guard.canActivate(contextFor('login', { ip: '2.2.2.2' }))).resolves.toBe(true);
  });

  it('shares the generation budget between routes and tracks by user', async () => {
    const ada = { ip: '1.1.1.1', user: { id: 'ada', email: 'ada@example.com' } };
    const bob = { ip: '1.1.1.1', user: { id: 'bob', email: 'bob@example.com' } };
    await hit(guard, 'create', ada, 5);
    await hit(guard, 'retry', ada, 5);

    await expect(guard.canActivate(contextFor('create', ada))).rejects.toThrow(HttpException);
    await expect(guard.canActivate(contextFor('create', bob))).resolves.toBe(true);
  });
});
