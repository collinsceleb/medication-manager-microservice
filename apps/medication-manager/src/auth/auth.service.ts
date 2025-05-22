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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}
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
                'Failed to communicate with users service. Please try again later.',
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
}
