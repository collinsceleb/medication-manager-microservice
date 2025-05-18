import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly datasource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      this.logger.error(
        `Error registering user: ${error.message}`,
        error.stack,
      );
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error; // Re-throw validation errors
      }

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
