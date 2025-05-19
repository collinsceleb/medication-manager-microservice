import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { VerificationsModule } from './verifications/verifications.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RmqModule } from '@app/common/rmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './verifications/entities/verification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/notification/.env', '.env'],
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
        entities: [Verification],
        synchronize: true,
        logging: true,
      }),
    }),
    VerificationsModule,
    RmqModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
