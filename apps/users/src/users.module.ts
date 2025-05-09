import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RmqModule } from '@app/common/rmq';
import { USERS_SERVICE } from '../../../libs/common/constants/service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

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
        entities: [User],
        synchronize: true,
        logging: false,
        migrations: [],
        subscribers: [],
      }),
    }),
    RmqModule.register({ name: USERS_SERVICE }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
