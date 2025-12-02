import { NotificationType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDispatchDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsUUID()
  business_id: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  recipients: string[];
}

export class CreateNotificationDispatchConsoleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  recipients: string[];
}

export class ScheduleNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsUUID()
  business_id: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduled_time: Date;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  recipients: string[];
}

export class ScheduleNotificationConsoleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduled_time: Date;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  recipients: string[];
}
