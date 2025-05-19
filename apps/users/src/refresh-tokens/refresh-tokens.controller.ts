import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RefreshTokensService } from './refresh-tokens.service';
import { CreateRefreshTokenDto } from './dto/create-refresh-token.dto';
import { UpdateRefreshTokenDto } from './dto/update-refresh-token.dto';

@Controller()
export class RefreshTokensController {
  constructor(private readonly refreshTokensService: RefreshTokensService) {}

  @MessagePattern('createRefreshToken')
  create(@Payload() createRefreshTokenDto: CreateRefreshTokenDto) {
    return this.refreshTokensService.create(createRefreshTokenDto);
  }

  @MessagePattern('findAllRefreshTokens')
  findAll() {
    return this.refreshTokensService.findAll();
  }

  @MessagePattern('findOneRefreshToken')
  findOne(@Payload() id: number) {
    return this.refreshTokensService.findOne(id);
  }

  @MessagePattern('updateRefreshToken')
  update(@Payload() updateRefreshTokenDto: UpdateRefreshTokenDto) {
    return this.refreshTokensService.update(updateRefreshTokenDto.id, updateRefreshTokenDto);
  }

  @MessagePattern('removeRefreshToken')
  remove(@Payload() id: number) {
    return this.refreshTokensService.remove(id);
  }
}
