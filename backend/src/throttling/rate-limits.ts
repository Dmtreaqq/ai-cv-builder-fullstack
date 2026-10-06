import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerOptions } from '@nestjs/throttler';
import { RATE_LIMIT_KEY } from './rate-limit.decorator.js';
import type { RateLimitName } from './rate-limit.decorator.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const LIMITS: Record<RateLimitName, { limit: number; ttl: number }> = {
  auth: { limit: 10, ttl: MINUTE },
  generation: { limit: 10, ttl: HOUR },
  answer: { limit: 60, ttl: HOUR },
};

export function rateLimitOf(context: ExecutionContext): RateLimitName | undefined {
  return Reflect.getMetadata(RATE_LIMIT_KEY, context.getHandler()) as RateLimitName | undefined;
}

// Each named throttler only counts the routes tagged with @RateLimit(name).
export function buildThrottlers(): ThrottlerOptions[] {
  return (Object.keys(LIMITS) as RateLimitName[]).map((name) => ({
    name,
    ...LIMITS[name],
    skipIf: (context: ExecutionContext) => rateLimitOf(context) !== name,
  }));
}
