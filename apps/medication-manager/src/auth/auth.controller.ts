import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from '../../../auth/src/dto/create-auth.dto';
import { Request } from 'express';
import { CreateRefreshTokenDto } from '../../../users/src/refresh-tokens/dto/create-refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { VerifyEmailDto } from '../../../users/src/dto/verify-email.dto';
import { ForgotPasswordDto } from '../../../users/src/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../../users/src/dto/reset-password.dto';
import { JwtAuthGuard } from '@app/auth-utils/jwt-auth/jwt-auth.guard';
import { CreatePermissionDto } from '../../../users/src/permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from '../../../users/src/permissions/dto/update-permission.dto';

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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Patch('revoke-all-tokens')
  async revokeAllTokens(@Query('userId') userId?: string) {
    return await this.authService.revokeAllTokens(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-permission')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.authService.createPermission(createPermissionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-permissions')
  async getPermissions() {
    return await this.authService.getPermissions();
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-permission/:id')
  async getPermissionById(@Param('id') id: string) {
    return await this.authService.getPermissionById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-permission/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.authService.updatePermission(id, updatePermissionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('delete-permission/:id')
  async deletePermission(@Param('id') id: string) {
    return await this.authService.deletePermission(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove-revoked-tokens')
  async removeRevokedTokens() {
    return await this.authService.removeRevokedTokens();
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
