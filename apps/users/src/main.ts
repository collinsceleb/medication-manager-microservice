import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(UsersModule);
  const configService = appContext.get(ConfigService);
  await appContext.close();

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(UsersModule, {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBIT_MQ_URI')],
        queue: configService.get<string>('RABBIT_MQ_USERS_QUEUE'),
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
  console.log('Users microservice is listening...');
}

bootstrap();
