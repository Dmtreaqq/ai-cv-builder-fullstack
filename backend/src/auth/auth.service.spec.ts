import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { CreateUserInput } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

const USER_ID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';

function storedUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: USER_ID,
    email: 'ada@example.com',
    name: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

describe('AuthService', () => {
  const users = {
    create: jest.fn<(input: CreateUserInput) => Promise<User>>(),
    findOne: jest.fn<(id: string) => Promise<User>>(),
    findByEmailWithPasswordHash: jest.fn<(email: string) => Promise<User | null>>(),
  };
  const jwt = { signAsync: jest.fn<(payload: object) => Promise<string>>() };
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('registers through UsersService, which hashes the password', async () => {
    const dto = { email: 'ada@example.com', password: 'correct-horse' };
    users.create.mockResolvedValue(storedUser());

    await expect(service.register(dto)).resolves.toMatchObject({ id: USER_ID });
    expect(users.create).toHaveBeenCalledWith(dto);
  });

  describe('login', () => {
    it('returns the user when the password matches', async () => {
      const passwordHash = await bcrypt.hash('correct-horse', 4);
      users.findByEmailWithPasswordHash.mockResolvedValue(storedUser({ passwordHash }));

      const user = await service.login({ email: 'ada@example.com', password: 'correct-horse' });

      expect(user.id).toBe(USER_ID);
      expect(users.findByEmailWithPasswordHash).toHaveBeenCalledWith('ada@example.com');
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-horse', 4);
      users.findByEmailWithPasswordHash.mockResolvedValue(storedUser({ passwordHash }));

      await expect(service.login({ email: 'ada@example.com', password: 'wrong' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password.'),
      );
    });

    it('rejects an unknown email with the same message', async () => {
      users.findByEmailWithPasswordHash.mockResolvedValue(null);

      await expect(service.login({ email: 'who@example.com', password: 'x' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password.'),
      );
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      users.findOne.mockResolvedValue(storedUser());

      await expect(service.me(USER_ID)).resolves.toMatchObject({ email: 'ada@example.com' });
    });

    it('turns a deleted user into 401', async () => {
      users.findOne.mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.me(USER_ID)).rejects.toThrow(
        new UnauthorizedException('Log in to continue.'),
      );
    });
  });

  it('signs a token with the user id as subject', async () => {
    jwt.signAsync.mockResolvedValue('signed');

    await expect(service.signToken(storedUser())).resolves.toBe('signed');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: USER_ID, email: 'ada@example.com' });
  });
});
