import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { USERS_SERVICE } from '../../../../libs/common/constants/service';
import { VerifyEmailDto } from '../../../users/src/dto/verify-email.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}
  async findUserById(id: string) {
    try {
      const response = await firstValueFrom(
        this.client.send({ cmd: 'get_user' }, id).pipe(
          timeout(30000),
          catchError((err) => {
            this.logger.error(
              `Microservice communication error: ${err.message}`,
            );
            throw new InternalServerErrorException(
              'Failed to communicate with user service. Please try again later.',
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
        'An error occurred while fetching user by ID. Please try again later.',
      );
    }
  }
}
