import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RmqModule } from '@app/common/rmq';
import { NOTIFICATION_SERVICE } from '../../../libs/common/constants/service';
import { DevicesModule } from './devices/devices.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { RefreshToken } from './refresh-tokens/entities/refresh-token.entity';
import { Device } from './devices/entities/device.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/users/.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, RefreshToken, Device],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    RmqModule,
    RmqModule.register({
      name: NOTIFICATION_SERVICE,
    }),
    DevicesModule,
    RefreshTokensModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
