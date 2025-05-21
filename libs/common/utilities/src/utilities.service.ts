import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sendgridMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LocationData } from '../../../../apps/users/src/location-data/location-data.interface';

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
  async getLocation(ipAddress: string) {
    try {
      const ipstackApiKey = this.configService.get<string>('IPSTACK_API_KEY');
      const response = await axios.get(
        `http://api.ipstack.com/${ipAddress}?access_key=${ipstackApiKey}`,
      );
      const {
        city,
        region_name,
        country_name,
        latitude,
        longitude,
      }: LocationData = response.data;
      return {
        city,
        region: region_name,
        country: country_name,
        latitude,
        longitude,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve location information',
        error,
      );
    }
  }
}
