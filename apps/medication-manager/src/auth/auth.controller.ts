import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from '../../../auth/src/dto/create-auth.dto';
import { Request } from 'express';
import { CreateRefreshTokenDto } from '../../../users/src/refresh-tokens/dto/create-refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() createAuthDto: CreateAuthDto, @Req() request: Request) {
    const metadata = {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
    return await this.authService.login(createAuthDto, metadata);
  }
  @Post('refreshToken/:uniqueDeviceId')
  async refreshToken(
    @Body() createRefreshTokenDto: CreateRefreshTokenDto,
    @Param('uniqueDeviceId') uniqueDeviceId: string,
    @Req() request: Request,
  ) {
    const metadata = {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
    return await this.authService.refreshToken(
      createRefreshTokenDto,
      uniqueDeviceId,
      metadata,
    );
  }
}
