import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './user.entity.js';

export const BCRYPT_ROUNDS = 12;
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.users.create({ email: dto.email, name: dto.name ?? null, passwordHash });

    let saved: User;
    try {
      saved = await this.users.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }

    return this.findOne(saved.id);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION
  );
}
