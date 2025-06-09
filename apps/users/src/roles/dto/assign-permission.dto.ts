import { IsNotEmpty, IsString } from 'class-validator';

export class AssignPermissionDto {
  @IsNotEmpty({ message: 'Permissions are required' })
  @IsString({ each: true, message: 'Permissions must be an array of strings' })
  permissions: string[];
}
