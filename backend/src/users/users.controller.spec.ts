import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

const user: User = {
  id: '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f',
  email: 'ada@example.com',
  name: 'Ada',
  passwordHash: 'should-never-leak',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
};

const expectedResponse = {
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

describe('UsersController', () => {
  const usersService = {
    create: jest.fn<(dto: CreateUserDto) => Promise<User>>(),
    findOne: jest.fn<(id: string) => Promise<User>>(),
  };
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();
    controller = moduleRef.get(UsersController);
  });

  it('creates a user and maps the response without the hash', async () => {
    const dto = { email: 'ada@example.com', password: 'secret', name: 'Ada' };
    usersService.create.mockResolvedValue(user);

    const response = await controller.create(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(response).toEqual(expectedResponse);
  });

  it('finds a user by id and maps the response without the hash', async () => {
    usersService.findOne.mockResolvedValue(user);

    const response = await controller.findOne(user.id);

    expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    expect(response).toEqual(expectedResponse);
  });
});
