import { Injectable } from '@nestjs/common';
import * as sendgridMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UtilitiesService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, text: string, subject = 'Medication Manager') {
    sendgridMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));

    const msg = {
      to,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
      subject,
      text,
    };

    try {
      return await sendgridMail.send(msg);
    } catch (error) {
      console.error(error);
    }
  }
}
