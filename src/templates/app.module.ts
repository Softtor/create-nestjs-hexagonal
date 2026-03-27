import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.service';

/**
 * Root application module.
 *
 * Add your bounded context modules here:
 *   imports: [EnvConfigModule.forRoot(), CqrsModule, CustomersModule, OrdersModule]
 *
 * Bounded contexts live under src/enterprise/<context-name>/
 */
@Module({
  imports: [
    EnvConfigModule.forRoot(),
    CqrsModule.forRoot(),
  ],
})
export class AppModule {}
