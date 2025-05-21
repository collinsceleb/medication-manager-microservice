import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NOTIFICATION_SERVICE } from '../../../libs/common/constants/service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly datasource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(NOTIFICATION_SERVICE)
    private readonly verificationClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, username, password, lastName, firstName } = createUserDto;
      await this.checkUserExists({ email, username });
      const user = queryRunner.manager.create(User, {
        email,
        username,
        password,
        lastName,
        firstName,
      });
      await user.hashPassword();
      await queryRunner.manager.save(User, user);
      await firstValueFrom(
        this.verificationClient.send(
          { cmd: 'create_verification' },
          {
            email: user.email,
            subject: 'Account Registration',
            templateName: 'default_verification',
          },
        ),
      );
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error registering user: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while registering the user. Please try again later.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async checkUserExists(checkUserDto: CheckUserDto): Promise<boolean> {
    try {
      const { email, username } = checkUserDto;
      const [emailCheck, usernameCheck] = await Promise.all([
        this.userRepository.findOne({ where: { email } }),
        this.userRepository.findOne({ where: { username } }),
      ]);
      if (emailCheck) {
        throw new BadRequestException('Email already exists');
      }
      if (usernameCheck) {
        throw new BadRequestException('Username already exists');
      }
      return true;
    } catch (error) {
      this.logger.error(`Error checking user existence: ${error.message}`);
      throw new InternalServerErrorException(
        'An error occurred while checking user existence. Please try again later.',
      );
    }
  }
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ user: User; message: string }> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { passcode, email } = verifyEmailDto;
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email },
      });
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }
      if (existingUser.isEmailVerified) {
        throw new BadRequestException('Email already verified');
      }
      const verification = await firstValueFrom(
        this.verificationClient.send(
          { cmd: 'verify_code' },
          { email, passcode },
        ),
      );
      if (!verification.success) {
        switch (verification.reason) {
          case 'INVALID_CODE':
            throw new BadRequestException(verification.message);
          case 'EXPIRED_CODE':
            throw new BadRequestException(verification.message);
          case 'MAX_ATTEMPTS':
            throw new BadRequestException(verification.message);
          case 'NOT_FOUND':
            throw new BadRequestException(verification.message);
          default:
            throw new BadRequestException('Invalid verification code');
        }
      }
      existingUser.isEmailVerified = true;
      await queryRunner.manager.save(User, existingUser);
      await queryRunner.commitTransaction();
      return {
        user: existingUser,
        message: 'Email verified successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in verifyEmail:', error.message);
      throw new InternalServerErrorException(
        'An error occurred while verifying email. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
