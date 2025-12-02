import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { MultimediaType, MultimediaProvider } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';

export class CreateMultimediaDto {
  @IsString()
  url: string;

  @IsEnum(MultimediaType)
  @IsNotEmpty()
  type: MultimediaType;

  @IsEnum(MultimediaProvider)
  @IsNotEmpty()
  provider: MultimediaProvider;
}

export class FilterMultimediaDto extends QueryDto {
  @IsUUID()
  @IsOptional()
  business_id?: string;

  @IsString()
  @IsOptional()
  q?: string;
}
