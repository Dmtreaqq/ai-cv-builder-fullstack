import type { User } from './user.entity.js';

export type UserResponse = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
