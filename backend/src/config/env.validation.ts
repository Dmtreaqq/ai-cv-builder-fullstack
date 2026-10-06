import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsString, IsUrl, Max, Min, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsUrl({ protocols: ['postgres', 'postgresql'], require_tld: false })
  DATABASE_URL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .map((message) => `  - ${message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
