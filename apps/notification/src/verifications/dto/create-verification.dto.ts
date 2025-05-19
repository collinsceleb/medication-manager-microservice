import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVerificationDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;
}
