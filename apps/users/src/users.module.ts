import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RmqModule } from '@app/common/rmq';
import { USERS_SERVICE } from '../../../libs/common/constants/service';

@Module({
  imports: [RmqModule.register({ name: USERS_SERVICE })],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
