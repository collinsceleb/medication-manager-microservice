import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { USERS_SERVICE } from '../../../libs/common/constants/service';
import { ClientProxy } from '@nestjs/microservices';
import { TokenResponse } from '../../users/src/token-response/token-response';
import { CreateAuthDto } from './dto/create-auth.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}
  async login(
    createAuthDto: CreateAuthDto,
    metadata: { userAgent: string; ipAddress: string },
  ): Promise<TokenResponse> {
    try {
      const { userAgent, ipAddress } = metadata;
      const user = await firstValueFrom(
        this.usersClient.send({ cmd: 'validate_user' }, createAuthDto),
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return await firstValueFrom(
        this.usersClient.send(
          { cmd: 'generate_tokens' },
          {
            user: { id: user.id, email: user.email },
            metadata: { userAgent, ipAddress },
          },
        ),
      );
    } catch (error) {
      console.error(`Error logging in: ${error.message}`);
      throw new InternalServerErrorException(
        'An error occurred while logging in. Please try again later.',
      );
    }
  }
}
