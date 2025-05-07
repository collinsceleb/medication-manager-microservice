import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { ConfigService } from '@nestjs/config';
import { RmqOptions } from '@nestjs/microservices';
import { RmqService } from '@app/common/rmq';
import { USERS_SERVICE } from '../../../libs/common/constants/service';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  const configService = app.get(ConfigService);
  const rmqService = app.get<RmqService>(RmqService);
  app.setGlobalPrefix('api');
  app.connectMicroservice<RmqOptions>(
    rmqService.getOptions(USERS_SERVICE, true),
  );
  await app.startAllMicroservices();
  // app.enableCors({
  //   origin: configService.get('CORS_ORIGIN'),
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });
  await app.listen(configService.get<number>('PORT'));
}
bootstrap();
