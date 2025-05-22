import {
  ClassSerializerInterceptor,
  Controller,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { RmqService } from '@app/common/rmq';
import { User } from './user.entity';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CreateAuthDto } from '../../auth/src/dto/create-auth.dto';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rmqService: RmqService,
  ) {}

  @MessagePattern({ cmd: 'register_user' })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: User,
  })
  async register(
    @Payload() createUserDto: CreateUserDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.usersService.register(createUserDto);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing register_user:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Registration failed',
        statusCode: error.status || 500,
      };
    }
  }
  @MessagePattern({ cmd: 'verify_email' })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: User,
  })
  async verifyEmail(
    @Payload() verifyEmailDto: VerifyEmailDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.usersService.verifyEmail(verifyEmailDto);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing email verification:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Email verification failed',
        statusCode: error.status || 500,
      };
    }
  }
  @MessagePattern({ cmd: 'get_user_by_email' })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: User,
  })
  async getUserByEmail(
    @Payload() email: string,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    try {
      const user = await this.usersService.findUserByEmail(email);
      // Acknowledge the message
      this.rmqService.ack(context);
      return user;
    } catch (error) {
      console.error('Error processing get_user_by_email:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return error;
    }
  }
  @MessagePattern({ cmd: 'validate_user' })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: User,
  })
  async validateUser(
    @Payload() createAuthDto: CreateAuthDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.usersService.validateUser(createAuthDto);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing validating user:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Validating user failed',
        statusCode: error.status || 500,
      };
    }
  }
}
