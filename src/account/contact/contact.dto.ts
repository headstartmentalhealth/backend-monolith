import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailDto, QueryDto } from '@/generic/generic.dto';
import { IsUUID } from 'class-validator';
import { MemberStatus } from '@prisma/client';
import { BusinessOwnerAccountRole, Role } from '@/generic/generic.data';

export class InviteContactDto extends EmailDto {
  @IsNotEmpty()
  @IsUUID()
  business_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;
}

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsUUID()
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;
}

export class FilterInvitesDto {
  @IsOptional()
  @IsEnum(MemberStatus, {
    message: `Status must be one of: ${Object.keys(MemberStatus).join(', ')}`,
  })
  status?: MemberStatus;

  @IsOptional()
  @IsEnum(BusinessOwnerAccountRole)
  role?: BusinessOwnerAccountRole;
}

export class FilterUserDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsUUID()
  @IsOptional()
  business_id?: string;

  @IsEnum(Role, {
    message: `Role must be one of: ${Object.keys(Role).join(', ')}`,
  })
  @IsOptional()
  role?: Role;

  @IsOptional()
  business_contacts?: boolean;
}

export class FilterContactsDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsUUID()
  @IsNotEmpty()
  business_id?: string;

  @IsEnum(Role, {
    message: `Role must be one of: ${Object.keys(Role).join(', ')}`,
  })
  @IsOptional()
  role?: Role;

  @IsOptional()
  business_contacts?: boolean;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  inquiry: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  organization: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  captcha_token: string;
}

export class NewsletterSubscriptionDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
