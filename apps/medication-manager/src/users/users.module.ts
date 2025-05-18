import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { USERS_SERVICE } from '../../../../libs/common/constants/service';
import { RmqModule } from '@app/common/rmq';

@Module({
  imports: [
    RmqModule.register({
      name: USERS_SERVICE,
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
