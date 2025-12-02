import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationTokenDto {
  @IsString()
  @IsNotEmpty()
  device_type: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
