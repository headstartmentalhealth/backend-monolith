import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNotificationTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
