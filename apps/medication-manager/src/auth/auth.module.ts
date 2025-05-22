import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RmqModule } from '@app/common/rmq';
import {
  AUTH_SERVICE,
  USERS_SERVICE,
} from '../../../../libs/common/constants/service';

@Module({
  imports: [
    RmqModule.register({
      name: AUTH_SERVICE,
    }),
    RmqModule.register({
      name: USERS_SERVICE,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
