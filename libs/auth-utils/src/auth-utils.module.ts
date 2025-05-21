import { Module } from '@nestjs/common';
import { AuthUtilsService } from './auth-utils.service';
import { SharedModule } from './shared/shared.module';

@Module({
  providers: [AuthUtilsService],
  exports: [AuthUtilsService, AuthUtilsModule],
  imports: [SharedModule],

})
export class AuthUtilsModule {}
