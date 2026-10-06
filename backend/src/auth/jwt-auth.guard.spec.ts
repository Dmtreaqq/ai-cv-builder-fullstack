import { describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE } from './auth-cookie.js';
import type { AuthenticatedRequest } from './auth-user.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Public } from './public.decorator.js';

const SECRET = 'test-secret-that-is-at-least-32-chars';
const jwt = new JwtService({ secret: SECRET });
const guard = new JwtAuthGuard(jwt, new Reflector());

class TestController {
  @Public()
  open() {}

  closed() {}
}

function contextFor(handler: 'open' | 'closed', cookies: Record<string, string> = {}) {
  const request = { cookies } as unknown as AuthenticatedRequest;
  const context = {
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  it('lets public routes through without a cookie', async () => {
    const { context, request } = contextFor('open');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('rejects a request without the cookie', async () => {
    const { context } = contextFor('closed');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Log in to continue.'),
    );
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'x'.repeat(32) }).signAsync({
      sub: 'u1',
      email: 'ada@example.com',
    });
    const { context } = contextFor('closed', { [AUTH_COOKIE]: forged });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const expired = await jwt.signAsync({ sub: 'u1', email: 'a@b.co' }, { expiresIn: -10 });
    const { context } = contextFor('closed', { [AUTH_COOKIE]: expired });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the user from a valid cookie', async () => {
    const token = await jwt.signAsync({ sub: 'u1', email: 'ada@example.com' });
    const { context, request } = contextFor('closed', { [AUTH_COOKIE]: token });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', email: 'ada@example.com' });
  });
});
