import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { toUserResponse } from './user-response.js';
import type { UserResponse } from './user-response.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return toUserResponse(await this.usersService.create(dto));
  }

  @Get(':id')
  async findOne(
    @Param(
      'id',
      new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException('Invalid user id') }),
    )
    id: string,
  ): Promise<UserResponse> {
    return toUserResponse(await this.usersService.findOne(id));
  }
}
