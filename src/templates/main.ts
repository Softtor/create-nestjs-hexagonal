import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainErrorFilter } from '@/shared/infrastructure/filters/domain-error.filter';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainErrorFilter());

  const envConfig = app.get(EnvConfigService);
  const port = envConfig.getAppPort();

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
