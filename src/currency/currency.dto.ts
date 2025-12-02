import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleCurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency: string;
}
