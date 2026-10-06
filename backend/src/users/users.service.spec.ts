import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

const USER_ID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';

function storedUser(overrides: Partial<User> = {}): User {
  const user = new User();
  Object.assign(user, {
    id: USER_ID,
    email: 'ada@example.com',
    name: 'Ada',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
  return user;
}

function uniqueViolation(): QueryFailedError {
  return new QueryFailedError(
    'INSERT',
    [],
    Object.assign(new Error('duplicate'), { code: '23505' }),
  );
}

describe('UsersService', () => {
  const repository = {
    create: jest.fn((data: Partial<User>) => Object.assign(new User(), data)),
    save: jest.fn<(user: User) => Promise<User>>(),
    findOneBy: jest.fn<(where: Partial<User>) => Promise<User | null>>(),
  };
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repository }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('hashes the password and returns the user without the hash', async () => {
      repository.save.mockImplementation(async (user) => Object.assign(user, { id: USER_ID }));
      repository.findOneBy.mockResolvedValue(storedUser());

      const result = await service.create({
        email: 'ada@example.com',
        password: 'secret',
        name: 'Ada',
      });

      const saved = repository.save.mock.calls[0][0];
      expect(saved.passwordHash).not.toBe('secret');
      await expect(bcrypt.compare('secret', saved.passwordHash)).resolves.toBe(true);
      expect(result.passwordHash).toBeUndefined();
      expect(result).toMatchObject({ id: USER_ID, email: 'ada@example.com', name: 'Ada' });
    });

    it('stores a missing name as null', async () => {
      repository.save.mockImplementation(async (user) => Object.assign(user, { id: USER_ID }));
      repository.findOneBy.mockResolvedValue(storedUser({ name: null }));

      await service.create({ email: 'ada@example.com', password: 'secret' });

      expect(repository.save.mock.calls[0][0].name).toBeNull();
    });

    it('throws ConflictException when the email is already taken', async () => {
      repository.save.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ email: 'ada@example.com', password: 'secret' }),
      ).rejects.toThrow(new ConflictException('An account with this email already exists.'));
    });

    it('rethrows other database errors', async () => {
      const error = new QueryFailedError('INSERT', [], new Error('connection lost'));
      repository.save.mockRejectedValue(error);

      await expect(service.create({ email: 'ada@example.com', password: 'secret' })).rejects.toBe(
        error,
      );
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = storedUser();
      repository.findOneBy.mockResolvedValue(user);

      await expect(service.findOne(USER_ID)).resolves.toBe(user);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: USER_ID });
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(USER_ID)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
