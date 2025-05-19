import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { VerificationsService } from './verifications.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { RmqService } from '@app/common/rmq';
import { Verification } from './entities/verification.entity';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller()
export class VerificationsController {
  constructor(
    private readonly verificationsService: VerificationsService,
    private readonly rmqService: RmqService,
  ) {}

  @MessagePattern({ cmd: 'create_verification' })
  async create(
    @Payload() createVerificationDto: CreateVerificationDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.verificationsService.createVerification(
        createVerificationDto,
      );
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing creating verification:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Creating verification failed',
        statusCode: error.status || 500,
      };
    }
  }

  @MessagePattern({ cmd: 'find_one_verification' })
  async findOne(@Payload() email: string, @Ctx() context: RmqContext) {
    try {
      const result = await this.verificationsService.findOne(email);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing fetching a verification:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Fetching a verification failed',
        statusCode: error.status || 500,
      };
    }
  }

  @MessagePattern({ cmd: 'delete_verification' })
  async deleteVerification(@Payload() id: string, @Ctx() context: RmqContext) {
    try {
      const result = await this.verificationsService.deleteVerification(id);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing deleting a verification:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Deleting a verification failed',
        statusCode: error.status || 500,
      };
    }
  }
  @MessagePattern({ cmd: 'verify_code' })
  async verifyCode(
    @Payload() verifyCodeDto: VerifyCodeDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.verificationsService.verifyCode(
        verifyCodeDto,
      );
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing verifying code:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Code verification failed',
        statusCode: error.status || 500,
      };
    }
  }
}
