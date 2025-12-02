import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateModuleContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  module_id: string;

  @IsUUID()
  @IsNotEmpty()
  multimedia_id: string;

  @IsInt()
  @IsNotEmpty()
  position: number;
}

export class UpdateModuleContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id?: string;
}

class ModuleContentPositionDto {
  @IsString()
  id: string; // ID of the module content

  @IsNumber()
  position: number; // New position of the module content
}

export class RearrangeModuleContentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleContentPositionDto)
  contents: ModuleContentPositionDto[];
}
