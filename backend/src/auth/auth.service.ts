import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { JwtPayload } from './auth-user.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  register(dto: RegisterDto): Promise<User> {
    return this.users.create(dto);
  }

  async login(dto: LoginDto): Promise<User> {
    const user = await this.users.findByEmailWithPasswordHash(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return user;
  }

  async me(userId: string): Promise<User> {
    try {
      return await this.users.findOne(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Log in to continue.');
      }
      throw error;
    }
  }

  signToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.signAsync(payload);
  }
}
