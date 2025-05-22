import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRefreshTokenDto } from './dto/create-refresh-token.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../devices/entities/device.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UtilitiesService } from '@app/utilities';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'node:crypto';
import { TokenResponse } from '../token-response/token-response';
import { JwtPayload } from '../jwt-payload/jwt-payload';

@Injectable()
export class RefreshTokensService {
  private readonly JWT_EXPIRATION_TIME =
    this.configService.get<number>('JWT_EXPIRATION_TIME') * 1000;
  private readonly JWT_ACCESS_EXPIRATION_TIME =
    this.configService.get<number>('JWT_ACCESS_EXPIRATION_TIME') * 1000;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly utilitiesService: UtilitiesService,
    private readonly datasource: DataSource,
  ) {}

  async generateTokens(
    user: { id: string; email: string },
    metadata: { userAgent: string; ipAddress: string },
  ): Promise<TokenResponse> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const jwtId = crypto.randomUUID();
      const { userAgent, ipAddress } = metadata;
      const { id, email } = user;
      const payload: JwtPayload = {
        sub: id,
        email: email,
        jwtId: jwtId,
      };
      const deviceDetails = this.getUserAgentInfo(userAgent);
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: `${this.JWT_ACCESS_EXPIRATION_TIME}ms`,
      });
      const location = await this.utilitiesService.getLocation(ipAddress);
      let device = await this.deviceRepository.findOne({
        where: {
          user: { id: user.id },
          ipAddress: ipAddress,
          deviceModel: deviceDetails.device.model,
          deviceVendor: deviceDetails.device.vendor,
          deviceType: deviceDetails.device.type,
          osName: deviceDetails.os.name,
          browserName: deviceDetails.browser.name,
        },
      });
      let uniqueDeviceId: string;
      if (device) {
        uniqueDeviceId = device.uniqueDeviceId;
        device.osVersion = deviceDetails.os.version;
        device.browserVersion = deviceDetails.browser.version;
        // await this.deviceRepository.save(device);
        await queryRunner.manager.save(device);
      } else {
        uniqueDeviceId = crypto.randomUUID();
        device = this.deviceRepository.create({
          uniqueDeviceId,
          userAgent,
          ipAddress,
          user: user.id as unknown as User,
          deviceModel: deviceDetails.device.model,
          deviceVendor: deviceDetails.device.vendor,
          deviceType: deviceDetails.device.type,
          osName: deviceDetails.os.name,
          osVersion: deviceDetails.os.version,
          browserName: deviceDetails.browser.name,
          browserVersion: deviceDetails.browser.version,
          city: location.city,
          country: location.country,
          region: location.region,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        // await this.deviceRepository.save(device);
        await queryRunner.manager.save(device);
      }
      const refreshTokenPayload = {
        ...payload,
        uniqueDeviceId,
      };
      const token = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: `${this.JWT_EXPIRATION_TIME}ms`,
      });
      const refreshToken = this.refreshTokenRepository.create({
        token: token,
        user: user,
        device: device,
        expiresAt: new Date(Date.now() + this.JWT_EXPIRATION_TIME),
      });
      // await this.refreshTokenRepository.save(refreshToken);
      await queryRunner.manager.save(refreshToken);
      await queryRunner.commitTransaction();
      return {
        accessToken: accessToken,
        refreshToken: refreshToken.token,
        uniqueDeviceId,
        // session: request.session,
        // sessionId: request.session.id,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error('Error generating tokens:', e);
      throw new InternalServerErrorException(
        'An error occurred while generating tokens. Please check server logs for details.',
        e.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Function to get user agent information
   * @param userAgent
   * @returns
   */
  // Function to retrieve device information based on the user agent
  private getUserAgentInfo(userAgent: string) {
    try {
      const userAgentInfo = UAParser(userAgent);
      return {
        browser: {
          name: userAgentInfo.browser.name || 'Unknown',
          version: userAgentInfo.browser.version || 'Unknown',
        },
        os: {
          name: userAgentInfo.os.name || 'Unknown',
          version: userAgentInfo.browser.version || 'unknown',
        },
        device: {
          type: userAgentInfo.device.type || 'Unknown',
          vendor: userAgentInfo.device.vendor || 'unknown',
          model: userAgentInfo.device.model || 'unknown',
        },
      };
    } catch (error) {
      console.error('Error fetching user agent information:', error.message);
      throw new InternalServerErrorException(
        'An error occurred while fetching user agent information. Please check server logs for details.',
        error.message,
      );
    }
  }

  async refreshToken(
    createRefreshTokenDto: CreateRefreshTokenDto,
    uniqueDeviceId: string,
    metadata: { userAgent: string; ipAddress: string },
  ): Promise<TokenResponse> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { refreshToken } = createRefreshTokenDto;
      const { userAgent, ipAddress } = metadata;
      if (typeof refreshToken !== 'string') {
        throw new BadRequestException('Invalid refresh token format');
      }
      const { payload, storedToken } = await this.findToken(
        uniqueDeviceId,
        refreshToken,
      );

      if (!payload) {
        throw new BadRequestException('Invalid refresh token');
      }
      if (typeof (payload.sub as unknown as User) !== 'string') {
        throw new BadRequestException(
          'Invalid user ID format. User ID should be a string',
        );
      }
      if (typeof uniqueDeviceId !== 'string') {
        throw new BadRequestException(
          'Invalid device ID format. Device ID should be a string',
        );
      }
      const isRevoked = await this.checkTokenRevocation(
        uniqueDeviceId,
        refreshToken,
      );
      if (isRevoked) {
        throw new BadRequestException(
          'Refresh token has been revoked. Please login again.',
        );
      }
      if (storedToken.expiresAt < new Date()) {
        await this.revokeToken(uniqueDeviceId, storedToken.token);
        throw new BadRequestException(
          'Refresh token has expired. Please Log in again',
        );
      }
      const device = await this.deviceRepository.findOne({
        where: {
          uniqueDeviceId: uniqueDeviceId,
          user: payload.sub as unknown as User,
        },
      });

      if (!device) {
        throw new NotFoundException('Device not found');
      }
      const deviceDetails = this.getUserAgentInfo(userAgent);
      const location = await this.utilitiesService.getLocation(ipAddress);
      await this.deviceRepository.update(
        { id: device.id },
        {
          userAgent,
          ipAddress,
          deviceModel: deviceDetails.device.model,
          deviceType: deviceDetails.device.type,
          deviceVendor: deviceDetails.device.vendor,
          browserName: deviceDetails.browser.name,
          browserVersion: deviceDetails.browser.version,
          osName: deviceDetails.os.name,
          osVersion: deviceDetails.os.version,
          city: location.city,
          country: location.country,
          region: location.region,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      );
      await this.revokeToken(uniqueDeviceId, storedToken.token);
      const newJwtId = crypto.randomUUID();
      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        jwtId: newJwtId,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '1h',
      });
      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, uniqueDeviceId: uniqueDeviceId },
        { expiresIn: `${this.JWT_EXPIRATION_TIME}ms` },
      );
      const newRefreshTokenDocument = this.refreshTokenRepository.create({
        token: newRefreshToken,
        device: device,
        user: payload.sub as unknown as User,
        expiresAt: new Date(Date.now() + this.JWT_EXPIRATION_TIME),
      });
      // await this.refreshTokenRepository.save(newRefreshTokenDocument);
      await queryRunner.manager.save(newRefreshTokenDocument);
      await queryRunner.commitTransaction();
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        uniqueDeviceId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error refreshing tokens:', error);
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Refresh token has expired', error);
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid refresh token', error);
      } else {
        throw new InternalServerErrorException(
          'An error occurred while refreshing tokens. Please check server logs for details.',
          error,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  async revokeToken(
    uniqueDeviceId: string,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      if (typeof refreshToken !== 'string') {
        throw new BadRequestException(
          'Invalid token format. Token should be a string',
        );
      }
      if (typeof uniqueDeviceId !== 'string') {
        throw new BadRequestException(
          'Invalid device ID format. Device ID should be a string',
        );
      }
      const { payload, storedToken } = await this.findToken(
        uniqueDeviceId,
        refreshToken,
      );
      if (!payload) {
        throw new BadRequestException('Invalid token');
      }
      if (!storedToken) {
        throw new NotFoundException('Token not found');
      }
      if (storedToken.isRevoked) {
        throw new BadRequestException('Token is already revoked');
      }
      storedToken.isRevoked = true;
      const token = await queryRunner.manager.save(RefreshToken, storedToken);
      await queryRunner.commitTransaction();
      return token;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error revoking token:', error);
      throw new InternalServerErrorException(
        'An error occurred while revoking token. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async checkTokenRevocation(
    uniqueDeviceId: string,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      if (typeof refreshToken !== 'string') {
        throw new BadRequestException(
          'Invalid token format. Token should be a string',
        );
      }
      const { payload, storedToken } = await this.findToken(
        uniqueDeviceId,
        refreshToken,
      );
      if (!payload) {
        throw new BadRequestException('Invalid token');
      }
      if (!storedToken) {
        throw new NotFoundException('Token not found');
      }
      if (storedToken.isRevoked) {
        throw new BadRequestException('Token is already revoked');
      }
      return false;
    } catch (error) {
      console.error('Error checking token revocation:', error);
      throw new InternalServerErrorException(
        'An error occurred while checking token revocation. Please check server logs for details.',
        error.message,
      );
    }
  }

  async findToken(
    uniqueDeviceId: string,
    refreshToken: string,
  ): Promise<{ payload: JwtPayload; storedToken: RefreshToken }> {
    try {
      if (typeof uniqueDeviceId !== 'string') {
        throw new BadRequestException(
          'Invalid device ID format. Device ID should be a string',
        );
      }
      if (typeof refreshToken !== 'string') {
        throw new BadRequestException('Refresh token must be a string');
      }
      const payload: JwtPayload = this.jwtService.verify(refreshToken);
      const existingDevice = await this.deviceRepository.findOne({
        where: {
          user: { id: payload.sub } as unknown as User,
          uniqueDeviceId: uniqueDeviceId,
        },
      });
      if (!existingDevice) {
        throw new NotFoundException('Device not found');
      }
      if (!payload) {
        throw new BadRequestException('Refresh token is not valid');
      }
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          user: { id: payload.sub } as unknown as User,
          device: { id: existingDevice.id } as unknown as Device,
        },
        relations: ['user', 'device'],
      });
      if (!storedToken) {
        throw new BadRequestException('Refresh token is not found');
      }

      return { payload, storedToken };
    } catch (error) {
      console.error('Error finding token:', error);
      throw new InternalServerErrorException('Failed to find token', error);
    }
  }

  async removeRevokedTokens(): Promise<number> {
    try {
      const result = await this.refreshTokenRepository.delete({
        isRevoked: true,
      });
      return result.affected || 0;
    } catch (error) {
      console.error('Error revoking all tokens:', error);
      throw new InternalServerErrorException(
        'An error occurred while revoking all tokens. Please check server logs for details.',
        error.message,
      );
    }
  }

  /**
   * Function to revoke all tokens
   * @returns tokens
   */
  async revokeAllTokens(userId?: string): Promise<void> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const whereCondition = userId
        ? { user: { id: userId }, isActive: true }
        : { isActive: true };
      await this.refreshTokenRepository.update(whereCondition, {
        isRevoked: true,
        isActive: false,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error revoking all tokens:', error);
      throw new InternalServerErrorException(
        'An error occurred while revoking all tokens. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
