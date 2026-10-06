import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedRequest = Request & { user?: AuthUser };
