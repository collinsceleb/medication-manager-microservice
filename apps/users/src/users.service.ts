import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NOTIFICATION_SERVICE } from '../../../libs/common/constants/service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly datasource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(NOTIFICATION_SERVICE)
    private readonly verificationClient: ClientProxy,
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
}
