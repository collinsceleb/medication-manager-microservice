import { AuthService } from './auth.service';
import { RmqService } from '@app/common/rmq';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateAuthDto } from './dto/create-auth.dto';

import { Controller } from '@nestjs/common';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rmqService: RmqService,
  ) {}

  @MessagePattern({ cmd: 'login_user' })
  async login(
    @Payload()
    data: {
      createAuthDto: CreateAuthDto;
      metadata: { userAgent: string; ipAddress: string };
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      const user = await this.authService.login(
        data.createAuthDto,
        data.metadata,
      );
      // Acknowledge the message if context is defined
      if (context) {
        this.rmqService.ack(context);
      } else {
        console.error('Context is undefined, cannot acknowledge message');
      }
      return user;
    } catch (error) {
      console.error('Error processing login:', error.message);

      // Acknowledge even on error if context is defined
      if (context) {
        this.rmqService.ack(context);
      } else {
        console.error('Context is undefined, cannot acknowledge message');
      }

      return error;
    }
  }
}
