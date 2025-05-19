import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    NotificationModule,
  );
  const configService = appContext.get(ConfigService);
  await appContext.close();

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      NotificationModule,
      {
        transport: Transport.RMQ,
        options: {
          urls: [configService.get<string>('RABBIT_MQ_URI')],
          queue: configService.get<string>('RABBIT_MQ_NOTIFICATION_QUEUE'),
          queueOptions: {
            durable: true,
          },
          noAck: false,
        },
      },
    );

  microservice.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await microservice.listen();
  console.log('Notification microservice is listening...');
}
bootstrap();
