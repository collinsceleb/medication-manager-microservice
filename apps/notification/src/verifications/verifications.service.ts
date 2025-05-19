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

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly utilitiesService: UtilitiesService,
    private readonly datasource: DataSource,
    @Inject(USERS_SERVICE)
    private readonly usersClient: ClientProxy,
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
      // Add more templates as needed
      default:
        throw new Error(`Unknown template: ${templateName}`);
    }
  }
}
