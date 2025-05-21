import { forwardRef, Module } from '@nestjs/common';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshTokensController } from './refresh-tokens.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { DevicesModule } from '../devices/devices.module';
import { UsersModule } from '../users.module';
import { SharedModule } from '@app/auth-utils/shared/shared.module';
import { UtilitiesModule } from '@app/utilities';
import { RmqModule } from '@app/common/rmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    DevicesModule,
    forwardRef(() => UsersModule),
    SharedModule,
    UtilitiesModule,
    RmqModule,
  ],
  controllers: [RefreshTokensController],
  providers: [RefreshTokensService],
})
export class RefreshTokensModule {}
