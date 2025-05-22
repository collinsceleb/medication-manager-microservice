import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from '../../../auth/src/dto/create-auth.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() createAuthDto: CreateAuthDto, @Req() request: Request) {
    const metadata = {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
    return await this.authService.login(createAuthDto, metadata);
  }
}
