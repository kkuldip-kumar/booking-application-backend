import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString() @IsNotEmpty() DATABASE_URL!: string;
  @IsString() @IsNotEmpty() REDIS_URL!: string;
  @IsString() @MinLength(32) JWT_ACCESS_SECRET!: string;
  @IsString() @IsNotEmpty() APP_BASE_URL!: string;
  @IsString() @IsNotEmpty() CORS_ORIGINS!: string;
  @IsString() @IsNotEmpty() SMTP_HOST!: string;
  @IsString() @IsNotEmpty() MAIL_FROM!: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const parsed = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: false });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment: ${errors.map((e) => e.property).join(', ')}`);
  }
  return config;
}
