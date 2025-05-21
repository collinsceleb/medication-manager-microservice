import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { RefreshTokensService } from './refresh-tokens.service';
import { CreateRefreshTokenDto } from './dto/create-refresh-token.dto';
import { RmqService } from '@app/common/rmq';

@Controller()
export class RefreshTokensController {
  constructor(
    private readonly refreshTokensService: RefreshTokensService,
    private readonly rmqService: RmqService,
  ) {}

  @MessagePattern({ cmd: 'refresh_token' })
  async refreshToken(
    @Payload()
    data: {
      createRefreshTokenDto: CreateRefreshTokenDto;
      uniqueDeviceId: string;
      metadata: { userAgent: string; ipAddress: string };
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      const { createRefreshTokenDto, uniqueDeviceId, metadata } = data;
      const result = await this.refreshTokensService.refreshToken(
        createRefreshTokenDto,
        uniqueDeviceId,
        metadata,
      );
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing token refresh:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Token refresh failed',
        statusCode: error.status || 500,
      };
    }
  }

  @MessagePattern({ cmd: 'revoke_token' })
  async revokeToken(
    @Payload()
    data: {
      refreshToken: string;
      uniqueDeviceId: string;
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      const { refreshToken, uniqueDeviceId } = data;
      const result = await this.refreshTokensService.revokeToken(
        uniqueDeviceId,
        refreshToken,
      );
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing revoking token:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Revoking token failed',
        statusCode: error.status || 500,
      };
    }
  }

  @MessagePattern({ cmd: 'revoke_all_tokens' })
  async revokeAllTokens(
    @Ctx() context: RmqContext,
    @Payload() userId?: string,
  ) {
    try {
      const result = await this.refreshTokensService.revokeAllTokens(userId);
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing revoking all tokens:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Revoking all tokens failed',
        statusCode: error.status || 500,
      };
    }
  }

  @MessagePattern({ cmd: 'generate_tokens' })
  async generateTokens(
    @Payload()
    data: {
      user: { id: string; email: string };
      metadata: { userAgent: string; ipAddress: string };
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      const { user, metadata } = data;
      const result = await this.refreshTokensService.generateTokens(
        user,
        metadata,
      );
      // Acknowledge the message
      this.rmqService.ack(context);
      return result;
    } catch (error) {
      console.error('Error processing generating tokens:', error.message);

      // Acknowledge even on error
      this.rmqService.ack(context);

      return {
        error: error.message || 'Tokens Generation failed',
        statusCode: error.status || 500,
      };
    }
  }
}
