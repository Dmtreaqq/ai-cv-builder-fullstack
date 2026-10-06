import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation.js';
import type { EnvironmentVariables } from './config/env.validation.js';
import { buildTypeOrmOptions } from './database/typeorm-options.js';
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
    UsersModule,
  ],
})
export class AppModule {}
