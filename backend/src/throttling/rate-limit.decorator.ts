import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitName = 'auth' | 'generation' | 'answer';

export const RateLimit = (name: RateLimitName) => SetMetadata(RATE_LIMIT_KEY, name);
