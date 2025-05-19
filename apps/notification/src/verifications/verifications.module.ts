import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { UtilitiesModule } from '@app/utilities';
import { RmqModule } from '@app/common/rmq';
import { USERS_SERVICE } from '../../../../libs/common/constants/service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Verification]),
    UtilitiesModule,
    RmqModule.register({
      name: USERS_SERVICE,
    }),
  ],
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService, TypeOrmModule],
})
export class VerificationsModule {}
