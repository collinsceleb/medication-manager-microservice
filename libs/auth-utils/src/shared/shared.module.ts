import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@app/auth-utils/jwt-strategy/jwt-strategy';
import { UsersModule } from '../../../../apps/users/src/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../apps/users/src/user.entity';

@Module({
  imports: [
    PassportModule.register({ session: true, defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: `${configService.get<number>('JWT_EXPIRATION_TIME')}ms`,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UsersModule),
  ],
  controllers: [],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule, JwtStrategy],
})
export class SharedModule {}
