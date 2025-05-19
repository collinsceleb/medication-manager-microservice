import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const configService = appContext.get(ConfigService);
  await appContext.close();

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBIT_MQ_URI')],
        queue: configService.get<string>('RABBIT_MQ_AUTH_QUEUE'),
        queueOptions: {
          durable: true,
        },
        noAck: false,
      },
    });

  microservice.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await microservice.listen();
  console.log('Auth microservice is listening...');
}
bootstrap();
