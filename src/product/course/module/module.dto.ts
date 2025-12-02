import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsUUID,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateModuleDto {
  @IsNotEmpty()
  @IsUUID()
  course_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsInt()
  position: number;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

class ModulePositionDto {
  @IsString()
  id: string; // ID of the module

  @IsNumber()
  position: number; // New position of the module
}

export class RearrangeModulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePositionDto)
  modules: ModulePositionDto[];
}

/**
 * DTO to create a single content under a module
 */
export class CreateModuleContentDto {
  @IsString({ message: 'Content title must be a string.' })
  @IsNotEmpty({ message: 'Content title is required.' })
  title: string;

  @IsNumber({}, { message: 'Content position must be a number.' })
  @IsNotEmpty({ message: 'Content position is required.' })
  position: number;

  @IsString({ message: 'Multimedia ID must be a valid string.' })
  @IsNotEmpty({ message: 'Multimedia ID is required.' })
  multimedia_id: string;
}

/**
 * DTO to create a single module with optional contents
 */
export class CreateModuleWithContentsDto {
  @IsString({ message: 'Module title must be a string.' })
  @IsNotEmpty({ message: 'Module title is required.' })
  title: string;

  @IsNumber({}, { message: 'Module position must be a number.' })
  @IsNotEmpty({ message: 'Module position is required.' })
  position: number;

  @IsString({ message: 'Course ID must be a valid string.' })
  @IsNotEmpty({ message: 'Course ID is required.' })
  course_id: string;

  @IsArray({ message: 'Contents must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateModuleContentDto)
  contents: CreateModuleContentDto[];
}

/**
 * DTO to create multiple modules (each with optional contents)
 */
export class CreateMultipleModulesDto {
  @IsArray({ message: 'Modules must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateModuleWithContentsDto)
  modules: CreateModuleWithContentsDto[];
}

export class UpdateModuleContentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  position: number;

  @IsUUID()
  multimedia_id: string;
}

export class UpdateModuleBulkDto {
  @IsUUID()
  @IsOptional()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  position: number;

  @IsString()
  course_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModuleContentDto)
  contents: UpdateModuleContentDto[];
}

export class BulkUpdateModulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModuleBulkDto)
  modules: UpdateModuleBulkDto[];
}

export class CourseIdDto {
  @IsString()
  @IsNotEmpty()
  course_id: string;
}
