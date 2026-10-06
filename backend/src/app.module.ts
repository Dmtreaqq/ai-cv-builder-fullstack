import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { validate } from './config/env.validation.js';
import type { EnvironmentVariables } from './config/env.validation.js';
import { buildTypeOrmOptions } from './database/typeorm-options.js';
import { buildThrottlers } from './throttling/rate-limits.js';
import { UserThrottlerGuard } from './throttling/user-throttler.guard.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildTypeOrmOptions(config.get('DATABASE_URL', { infer: true })),
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRoot({ throttlers: buildThrottlers() }),
    UsersModule,
    AuthModule,
  ],
  providers: [
    // Order matters: authentication runs first so the throttler can track by user id.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
