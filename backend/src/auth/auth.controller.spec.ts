import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import type { User } from '../users/user.entity.js';
import { AUTH_COOKIE } from './auth-cookie.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const user: User = {
  id: '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f',
  email: 'ada@example.com',
  name: null,
  passwordHash: 'should-never-leak',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
};

const userResponse = {
  id: user.id,
  email: user.email,
  name: null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

function mockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('AuthController', () => {
  const auth = {
    register: jest.fn<AuthService['register']>(),
    login: jest.fn<AuthService['login']>(),
    me: jest.fn<AuthService['me']>(),
    signToken: jest.fn<AuthService['signToken']>(),
  };

  async function createController(nodeEnv = 'development') {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ConfigService, useValue: { get: () => nodeEnv } },
      ],
    }).compile();
    return moduleRef.get(AuthController);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    auth.signToken.mockResolvedValue('signed-token');
  });

  it('registers, sets the session cookie and never returns the hash', async () => {
    const controller = await createController();
    const res = mockResponse();
    auth.register.mockResolvedValue(user);

    const body = await controller.register(
      { email: user.email, password: 'correct-horse' },
      res as unknown as Response,
    );

    expect(body).toEqual({ user: userResponse });
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE,
      'signed-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' }),
    );
  });

  it('logs in and sets a 7 day secure cookie in production', async () => {
    const controller = await createController('production');
    const res = mockResponse();
    auth.login.mockResolvedValue(user);

    const body = await controller.login(
      { email: user.email, password: 'correct-horse' },
      res as unknown as Response,
    );

    expect(body).toEqual({ user: userResponse });
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE,
      'signed-token',
      expect.objectContaining({ secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 }),
    );
  });

  it('clears the cookie on logout', async () => {
    const controller = await createController();
    const res = mockResponse();

    controller.logout(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE,
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });

  it('returns the current user from me', async () => {
    const controller = await createController();
    auth.me.mockResolvedValue(user);

    await expect(controller.me({ id: user.id, email: user.email })).resolves.toEqual({
      user: userResponse,
    });
    expect(auth.me).toHaveBeenCalledWith(user.id);
  });
});
