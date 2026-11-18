import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // API Prefix
  app.setGlobalPrefix('trishul');

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(configService.get<string>('PORT')) || 3001;

  await app.listen(port);

  console.log(`Backend running: http://localhost:${port}`);
  console.log(`API URL: http://localhost:${port}/trishul/`);
}

bootstrap();