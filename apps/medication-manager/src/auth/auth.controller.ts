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
import { CreateRoleDto } from '../../../users/src/roles/dto/create-role.dto';
import { UpdateRoleDto } from '../../../users/src/roles/dto/update-role.dto';
import { AssignPermissionDto } from '../../../users/src/roles/dto/assign-permission.dto';

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

  @UseGuards(JwtAuthGuard)
  @Post('create-role')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.authService.createRole(createRoleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-roles')
  async getRoles() {
    return await this.authService.getRoles();
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-role/:id')
  async getRoleById(@Param('id') id: string) {
    return await this.authService.getRoleById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-role/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.authService.updateRole(id, updateRoleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('delete-role/:id')
  async deleteRole(@Param('id') id: string) {
    return await this.authService.deleteRole(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':roleId/assign-permissions-role')
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionDto,
  ) {
    return await this.authService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':roleId/remove-permissions-role')
  async removePermissionsFromRole(
    @Param('roleId') roleId: string,
    @Body() removePermissionsDto: AssignPermissionDto,
  ) {
    return await this.authService.removePermissionsFromRole(
      roleId,
      removePermissionsDto,
    );
  }
}
