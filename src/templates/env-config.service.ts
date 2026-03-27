import { Module, DynamicModule, Global, Injectable, Inject } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { join } from 'path';

/**
 * Port interface for reading environment configuration.
 * Consume this via injection; never depend on `ConfigService` directly outside infra.
 */
export interface EnvConfig {
  getAppPort(): number;
  getEnvironment(): 'development' | 'staging' | 'production' | 'test';
  isProduction(): boolean;
  getDatabaseUrl(): string;
  getJwtSecret(): string;
  getJwtExpiresInSeconds(): number;
  getFrontendUrl(): string;
  getBackendUrl(): string;
}

/**
 * Concrete implementation of `EnvConfig` backed by NestJS `ConfigService`.
 * Injectable only within the infrastructure layer.
 */
@Injectable()
export class EnvConfigService implements EnvConfig {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  private getString(key: string, defaultValue?: string): string {
    const value = this.config.get<string>(key, defaultValue);
    if (value === undefined || value === null) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getNumber(key: string, defaultValue?: number): number {
    const raw = this.config.get<string>(key);
    const value = raw !== undefined ? Number(raw) : defaultValue;
    if (value === undefined || Number.isNaN(value)) {
      throw new Error(`Missing or invalid environment variable: ${key} (expected number)`);
    }
    return value;
  }

  getAppPort(): number {
    return this.getNumber('APP_PORT', 3000);
  }

  getEnvironment(): 'development' | 'staging' | 'production' | 'test' {
    const env = this.config.get<string>('NODE_ENV', 'development');
    return env as 'development' | 'staging' | 'production' | 'test';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  getDatabaseUrl(): string {
    return this.getString('DATABASE_URL');
  }

  getJwtSecret(): string {
    return this.getString('JWT_SECRET');
  }

  getJwtExpiresInSeconds(): number {
    return this.getNumber('JWT_EXPIRES_IN_SECONDS', 3600);
  }

  getFrontendUrl(): string {
    return this.getString('FRONTEND_URL');
  }

  getBackendUrl(): string {
    return this.getString('API_URL');
  }
}

/**
 * Global module providing `EnvConfigService` everywhere.
 *
 * Usage in AppModule:
 *   imports: [EnvConfigModule.forRoot()]
 */
@Global()
@Module({})
export class EnvConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: EnvConfigModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: [
            join(process.cwd(), '.env'),
            join(process.cwd(), `.env.${process.env.NODE_ENV ?? 'development'}.local`),
          ],
          ...options,
        }),
      ],
      providers: [EnvConfigService],
      exports: [EnvConfigService],
    };
  }
}
