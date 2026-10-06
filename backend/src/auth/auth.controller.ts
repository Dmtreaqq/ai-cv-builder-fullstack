import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { RateLimit } from '../throttling/rate-limit.decorator.js';
import type { User } from '../users/user.entity.js';
import { toUserResponse } from '../users/user-response.js';
import type { UserResponse } from '../users/user-response.js';
import { AUTH_COOKIE, authCookieOptions, sessionCookieOptions } from './auth-cookie.js';
import type { AuthUser } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { Public } from './public.decorator.js';

export type AuthResponse = { user: UserResponse };

@Controller('auth')
export class AuthController {
  private readonly production: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.production = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  @Public()
  @RateLimit('auth')
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.startSession(await this.auth.register(dto), res);
  }

  @Public()
  @RateLimit('auth')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.startSession(await this.auth.login(dto), res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE, authCookieOptions(this.production));
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<AuthResponse> {
    return { user: toUserResponse(await this.auth.me(user.id)) };
  }

  private async startSession(user: User, res: Response): Promise<AuthResponse> {
    const token = await this.auth.signToken(user);
    res.cookie(AUTH_COOKIE, token, sessionCookieOptions(this.production));
    return { user: toUserResponse(user) };
  }
}
