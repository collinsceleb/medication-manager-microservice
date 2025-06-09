import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  AUTH_SERVICE,
  USERS_SERVICE,
} from '../../../../libs/common/constants/service';
import { ClientProxy } from '@nestjs/microservices';
import { CreateAuthDto } from '../../../auth/src/dto/create-auth.dto';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { CreateRefreshTokenDto } from '../../../users/src/refresh-tokens/dto/create-refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { VerifyEmailDto } from '../../../users/src/dto/verify-email.dto';
import { ForgotPasswordDto } from '../../../users/src/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../../users/src/dto/reset-password.dto';
import { CreatePermissionDto } from '../../../users/src/permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from '../../../users/src/permissions/dto/update-permission.dto';
import { CreateRoleDto } from '../../../users/src/roles/dto/create-role.dto';
import { UpdateRoleDto } from '../../../users/src/roles/dto/update-role.dto';
import { AssignPermissionDto } from '../../../users/src/roles/dto/assign-permission.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}
  async register(createUserDto: CreateUserDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'register_user' }, createUserDto).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while registering the user. Please try again later.',
      );
    }
  }
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'verify_email' }, verifyEmailDto).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while verifying email. Please try again later.',
      );
    }
  }
  async login(
    createAuthDto: CreateAuthDto,
    metadata: { userAgent: string; ipAddress: string },
  ) {
    try {
      const response = await firstValueFrom(
        this.authClient
          .send({ cmd: 'login_user' }, { createAuthDto, metadata })
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while login the user. Please try again later.',
      );
    }
  }
  async refreshToken(
    createRefreshTokenDto: CreateRefreshTokenDto,
    uniqueDeviceId: string,
    metadata: { userAgent: string; ipAddress: string },
  ) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send(
            { cmd: 'refresh_token' },
            { createRefreshTokenDto, uniqueDeviceId, metadata },
          )
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while refreshing the token. Please try again later.',
      );
    }
  }
  async revokeToken(
    uniqueDeviceId: string,
    createRefreshTokenDto: CreateRefreshTokenDto,
  ) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send(
            { cmd: 'revoke_token' },
            { uniqueDeviceId, createRefreshTokenDto },
          )
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while revoking the token. Please try again later.',
      );
    }
  }
  async revokeAllTokens(userId?: string) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'revoke_all_tokens' }, { userId }).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while revoking all the tokens. Please try again later.',
      );
    }
  }
  async removeRevokedTokens() {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'remove_revoked_tokens' }, {}).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while revoking all the tokens. Please try again later.',
      );
    }
  }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send({ cmd: 'forgot_password' }, forgotPasswordDto)
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while forgot password. Please try again later.',
      );
    }
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'reset_password' }, resetPasswordDto).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while resetting password. Please try again later.',
      );
    }
  }
  async createPermission(createPermissionDto: CreatePermissionDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send({ cmd: 'create_permission' }, createPermissionDto)
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating permission. Please try again later.',
      );
    }
  }
  async getPermissions() {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'get_all_permissions' }, {}).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while getting permissions Please try again later.',
      );
    }
  }
  async getPermissionById(id: string) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'get_permission' }, { id }).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while getting permission. Please try again later.',
      );
    }
  }
  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send({ cmd: 'update_permission' }, { id, updatePermissionDto })
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating permission. Please try again later.',
      );
    }
  }
  async deletePermission(id: string) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'delete_permission' }, { id }).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting permission. Please try again later.',
      );
    }
  }
  async createRole(createRoleDto: CreateRoleDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'create_role' }, createRoleDto).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating role. Please try again later.',
      );
    }
  }

  async getRoles() {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'get_all_roles' }, {}).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while getting all roles. Please try again later.',
      );
    }
  }

  async getRoleById(id: string) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'get_role' }, { id }).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while getting a role. Please try again later.',
      );
    }
  }
  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send({ cmd: 'update_role' }, { id, updateRoleDto })
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating role. Please try again later.',
      );
    }
  }
  async deleteRole(id: string) {
    try {
      const response = await firstValueFrom(
        this.usersClient.send({ cmd: 'delete_role' }, { id }).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with auth service. Please try again later.',
            );
          }),
        ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting role. Please try again later.',
      );
    }
  }
  async assignPermissionsToRole(
    roleId: string,
    assignPermissionsDto: AssignPermissionDto,
  ) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send(
            { cmd: 'assign_permissions_to_role' },
            { roleId, assignPermissionsDto },
          )
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while assigning permissions to role. Please try again later.',
      );
    }
  }
  async removePermissionsFromRole(
    roleId: string,
    assignPermissionsDto: AssignPermissionDto,
  ) {
    try {
      const response = await firstValueFrom(
        this.usersClient
          .send(
            { cmd: 'remove_permissions_from_role' },
            { roleId, assignPermissionsDto },
          )
          .pipe(
            timeout(30000),
            catchError((err) => {
              this.logger.error(
                `Microservice communication error: ${err.message}`,
              );
              throw new InternalServerErrorException(
                'Failed to communicate with auth service. Please try again later.',
              );
            }),
          ),
      );
      if (response?.error) {
        throw new BadRequestException(response.error);
      }
      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while from permissions from role. Please try again later.',
      );
    }
  }
}
