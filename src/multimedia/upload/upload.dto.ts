import { IsOptional, IsString } from 'class-validator';

export class AddFileBodyDto {
  @IsOptional()
  @IsString()
  purpose: string;
}
