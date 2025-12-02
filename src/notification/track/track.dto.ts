import { QueryDto } from '@/generic/generic.dto';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class FetchInstantNotificationsDto {}

// DTO for filtering notifications
export class FetchScheduledNotificationsDto {}

export class FilterNotificationsDto extends QueryDto {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  status?: Boolean;

  @IsEnum(NotificationType, {
    message: `type must be of the following: ${Object.values(NotificationType).join(', ')}`,
  })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  type?: NotificationType;

  @IsString()
  @IsOptional()
  q?: string;
}

export class FilterScheduledDto extends FilterNotificationsDto {
  @IsEnum(NotificationStatus, {
    message: `schedule status must be of the following: ${Object.values(NotificationStatus).join(', ')}`,
  })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  schedule_status?: NotificationStatus;

  @IsString()
  @IsOptional()
  q?: string;
}
