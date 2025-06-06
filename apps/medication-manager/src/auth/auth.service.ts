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
          .send({ cmd: 'forgot_password' }, { forgotPasswordDto })
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
        this.usersClient
          .send({ cmd: 'forgot_password' }, { resetPasswordDto })
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
        'An error occurred while resetting password. Please try again later.',
      );
    }
  }
}
