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
import { CreateAuthDto } from '../../auth/src/dto/create-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from './roles/entities/role.entity';

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
      const { email, username, password, lastName, firstName, role } =
        createUserDto;
      await this.checkUserExists({ email, username });
      let assignedRole: Role;
      const userRoleName = role;
      if (userRoleName) {
        assignedRole = await queryRunner.manager.findOne(Role, {
          where: { name: userRoleName as unknown as string },
        });
        if (!assignedRole) {
          throw new BadRequestException(`Role ${userRoleName} does not exist`);
        }
      } else {
        assignedRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'User' },
        });
        if (!assignedRole) {
          throw new InternalServerErrorException(
            'Default role not found. Please contact support.',
          );
        }
      }
      const user = queryRunner.manager.create(User, {
        email,
        username,
        password,
        lastName,
        firstName,
        role: assignedRole.id as unknown as Role,
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
  async findUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`);
      throw new InternalServerErrorException(
        'An error occurred while finding user by email. Please try again later.',
      );
    }
  }
  async validateUser(createAuthDto: CreateAuthDto): Promise<User> {
    try {
      const { email, password } = createAuthDto;
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.isDeleted) {
        throw new BadRequestException('Account does not exist');
      }
      if (!user.isEmailVerified) {
        throw new BadRequestException(
          'Email not verified. Please, verify your email.',
        );
      }
      if (user.isLocked) {
        throw new BadRequestException(
          'Account is locked. Kindly reset your password.',
        );
      }
      if (user.isBlocked) {
        throw new BadRequestException(
          'Account is blocked. Kindly contact support.',
        );
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
      user.lastLogin = new Date();
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.logger.error(`Error checking user status: ${error.message}`);
      throw new InternalServerErrorException(
        'An error occurred while checking user status. Please try again later.',
      );
    }
  }
  async findUserById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by id: ${error.message}`);
      throw new InternalServerErrorException(
        'An error occurred while finding user by id. Please try again later.',
      );
    }
  }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<User> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email } = forgotPasswordDto;
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (user.isDeleted) {
        throw new BadRequestException('Account does not exist');
      }
      if (user.isBlocked) {
        throw new BadRequestException(
          'User account is locked. Please contact support.',
        );
      }
      await firstValueFrom(
        this.verificationClient.send(
          { cmd: 'create_verification' },
          {
            email: user.email,
            subject: 'Password Reset',
            templateName: 'forgot_password',
          },
        ),
      );
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in forgetPassword:', error.message);
      throw new InternalServerErrorException(
        'An error occurred while processing the password reset request. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ user: User; message: string }> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, passcode, newPassword } = resetPasswordDto;
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
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
      user.password = newPassword;
      await user.hashPassword();
      await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return { user, message: 'Password reset successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in resetPassword:', error.message);
      throw new InternalServerErrorException(
        'An error occurred while resetting the password. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
