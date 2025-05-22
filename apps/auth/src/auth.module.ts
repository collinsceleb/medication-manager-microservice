import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { RmqModule, RmqService } from '@app/common/rmq';
import { AUTH_SERVICE, USERS_SERVICE } from '../../../libs/common/constants/service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/auth/.env', '.env'],
    }),
    RmqModule.register({
      name: USERS_SERVICE,
    }),
    RmqModule.register({
      name: AUTH_SERVICE,
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, RmqService],
})
export class AuthModule {}
