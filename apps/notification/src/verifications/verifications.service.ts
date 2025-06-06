import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { UtilitiesService } from '@app/utilities';
import { Verification } from './entities/verification.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { genCode } from '../../../../libs/common/string';
import { ClientProxy } from '@nestjs/microservices';
import { USERS_SERVICE } from '../../../../libs/common/constants/service';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationsService {
  private readonly VERIFICATION_RETRIES = this.configService.get<number>(
    'VERIFICATION_RETRIES',
  );
  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly utilitiesService: UtilitiesService,
    private readonly datasource: DataSource,
    @Inject(USERS_SERVICE)
    private readonly usersClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}
  async createVerification(createVerificationDto: CreateVerificationDto) {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, templateName, subject } = createVerificationDto;
      const verification = queryRunner.manager.create(Verification, {
        email,
        passcode: genCode(6),
        tries: 0,
        expiresAt: dayjs().add(10, 'minutes').toDate(),
      });
      await queryRunner.manager.save(Verification, verification);
      await queryRunner.commitTransaction();
      const message = this.renderTemplate(
        templateName,
        verification.passcode,
        verification.expiresAt,
      );
      await this.utilitiesService.sendEmail(email, message, subject);
      return verification;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating verification', error);
      throw new InternalServerErrorException(
        'An error occurred while creating verification. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
  async findOne(email: string) {
    return await this.verificationRepository.findOne({
      where: { email: email },
    });
  }
  async deleteVerification(id: string) {
    return await this.verificationRepository.delete(id);
  }
  private renderTemplate(
    templateName: string,
    code: string,
    expiresAt: Date,
  ): string {
    switch (templateName) {
      case 'default_verification':
        return `Thank you for registering. Use ${code} to verify your email. The code expires in ${expiresAt}.`;
      case 'forgot_password':
        return `Use ${code} to reset your password. The code expires in ${expiresAt}.`;
      case 'change_password':
        return `You requested to change your password. Use this ${code} to change your password. The code expires in ${expiresAt}.`;
      // Add more templates as needed
      default:
        throw new Error(`Unknown template: ${templateName}`);
    }
  }
  async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, passcode } = verifyCodeDto;
      const verification = await this.findOne(email);
      if (!verification) {
        await this.createVerification({
          email,
          templateName: 'default_verification',
          subject: 'Account Registration',
        });
        return {
          success: false,
          reason: 'NOT_FOUND',
          message: new BadRequestException(
            'No verification found. A new one has been sent. Check your email',
          ),
        };
      } else if (verification.passcode !== passcode) {
        verification.tries = Math.max(0, verification.tries + 1);
        const attemptLeft = this.VERIFICATION_RETRIES - verification.tries;
        await queryRunner.manager.save(Verification, verification);
        if (verification.tries >= this.VERIFICATION_RETRIES) {
          await this.deleteVerification(verification.id);
          await this.createVerification({
            email,
            templateName: 'default_verification',
            subject: 'Account Registration',
          });
          return {
            success: false,
            reason: 'MAX_ATTEMPTS',
            message:
              'Maximum verification attempts reached. A new code has been generated and sent. Check your mail',
          };
        }
        return {
          success: false,
          reason: 'INVALID_CODE',
          message: new BadRequestException(
            `Invalid verification code. Attempt left is ${attemptLeft}.`,
          ),
        };
      }
      if (verification.expiresAt < new Date()) {
        await this.deleteVerification(verification.id);
        await this.createVerification({
          email,
          templateName: 'default_verification',
          subject: 'Account Registration',
        });
        return {
          success: false,
          reason: 'EXPIRED_CODE',
          message: new BadRequestException(
            'Verification code has expired. A new one has been sent. Check your mail.',
          ),
        };
      }
      await this.deleteVerification(verification.id);
      await queryRunner.commitTransaction();
      return {
        success: true,
        reason: 'CODE_VERIFIED',
        message: 'Code verified successfully.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in verifyCode:', error.message);
      throw new InternalServerErrorException(
        'An error occurred while verifying code. Please check server logs for details.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
