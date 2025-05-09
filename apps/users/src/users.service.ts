import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { isEmail } from 'class-validator';
import { MessagePattern } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly datasource: DataSource,
  ) {}

  @MessagePattern('register-user')
  async register(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, username, password, lastName, firstName } = createUserDto;
      if (!isEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }
      await this.checkUserExists({ email, username });
      const user = queryRunner.manager.create(User, {
        email,
        username,
        password: password,
        lastName,
        firstName,
      });
      await user.hashPassword();
      await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error registering user', error);
      throw new InternalServerErrorException(
        'An error occurred while registering the user. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
  async checkUserExists(checkUserDto: CheckUserDto): Promise<boolean> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, username } = checkUserDto;
      const [emailCheck, usernameCheck] = await Promise.all([
        this.usersRepository.findOne({ where: { email } }),
        this.usersRepository.findOne({ where: { username } }),
      ]);
      if (emailCheck) {
        throw new BadRequestException('Email already exists');
      }
      if (usernameCheck) {
        throw new BadRequestException('Username already exists');
      }
      // if (!emailCheck && !usernameCheck) {
      //   return true;
      // }
      await queryRunner.commitTransaction();
      return false;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
