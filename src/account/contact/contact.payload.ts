import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  invite_id: string;
}
