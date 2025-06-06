import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from '../../../auth/src/dto/create-auth.dto';
import { Request } from 'express';
import { CreateRefreshTokenDto } from '../../../users/src/refresh-tokens/dto/create-refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { VerifyEmailDto } from '../../../users/src/dto/verify-email.dto';
import { ForgotPasswordDto } from '../../../users/src/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../../users/src/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }
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

  @Patch('revoke-token/:uniqueDeviceId')
  async revokeToken(
    @Param('uniqueDeviceId') uniqueDeviceId: string,
    @Body() createRefreshTokenDto: CreateRefreshTokenDto,
  ) {
    return await this.authService.revokeToken(
      uniqueDeviceId,
      createRefreshTokenDto,
    );
  }

  @Patch('revoke-all-tokens')
  async revokeAllTokens(@Query('userId') userId?: string) {
    return await this.authService.revokeAllTokens(userId);
  }

  @Delete('remove-revoked-tokens')
  async removeRevokedTokens() {
    return await this.authService.removeRevokedTokens();
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('forgot-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
