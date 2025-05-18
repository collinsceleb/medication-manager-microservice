import { NestFactory } from '@nestjs/core';
import { MedicationManagerModule } from './medication-manager.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(MedicationManagerModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const PORT = configService.get<number>('PORT');
  await app.listen(PORT);
  console.log(`Medication Manager Gateway is running on port ${PORT}/api`);
}
bootstrap();
