import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsUUID,
  IsBooleanString,
  IsBoolean,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';

import { BusinessSize } from '@prisma/client';
import {
  BusinessOwnerAccountRole,
  DEFAULT_COUNTRY,
} from '@/generic/generic.data';
import { QueryDto } from '@/generic/generic.dto';
import { AddMultipleToCartDto } from '@/cart/cart.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class SocialMediaHandle {
  @IsString()
  @IsNotEmpty()
  handle: string;

  @IsString()
  @IsNotEmpty()
  link: string;
}

export class SaveBusinessInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  business_name: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(255)
  business_description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialMediaHandle)
  social_media_handles?: SocialMediaHandle[];

  @IsEnum(BusinessSize)
  @IsNotEmpty()
  business_size: BusinessSize;

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  business_slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timeline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  logo_url?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  industry: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  working_hours?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  country?: string = DEFAULT_COUNTRY;
}

export class UpsertWithdrawalAccountDto {
  @IsUUID()
  @IsNotEmpty()
  business_id: string;

  // @IsOptional()
  // @IsUUID()
  // withdrawal_account_id?: string; // Optional for updates

  @IsNotEmpty()
  @MaxLength(255)
  account_number: string;

  @IsOptional()
  @MaxLength(100)
  account_type: string;

  @IsNotEmpty()
  @MaxLength(255)
  bank_code: string;

  @IsNotEmpty()
  @MaxLength(255)
  bank_name: string;

  @IsOptional()
  @MaxLength(255)
  routing_number?: string;

  @IsOptional()
  @MaxLength(255)
  country?: string;

  @IsOptional()
  @IsString()
  recipient_code?: string;
}

export class FilterBusinessDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsBooleanString()
  @IsOptional()
  deleted?: string;
}

export class SuspendBusinessOwnerDto {
  @IsString()
  @IsNotEmpty()
  suspension_reason: string;
}

export class FilterBusinessOwnerDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

export class ImportBusinessUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ImportBusinessUsersDto {
  @IsNotEmpty()
  users: ImportBusinessUserDto[];
}

export class ExportBusinessUsersDto {
  @IsOptional()
  @IsString()
  format?: 'csv' | 'json' | 'xlsx';

  @IsOptional()
  @IsEnum(BusinessOwnerAccountRole)
  role?: BusinessOwnerAccountRole;
}

export class AddCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsUUID()
  @IsNotEmpty()
  business_id: string;
}

export class UpsertKycDto {
  @IsString()
  @IsNotEmpty()
  doc_front: string;

  @IsString()
  @IsNotEmpty()
  doc_back: string;

  @IsString()
  @IsNotEmpty()
  utility_doc: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  id_type: string;

  // For response typing only (not user input)
  is_approved?: boolean;
  disapproval_reason?: string;
}

export class ReviewKycDto {
  @IsNotEmpty()
  @IsBoolean()
  is_approved: boolean;

  @IsOptional()
  @IsString()
  disapproval_reason?: string;
}

export class BusinessNameDto {
  @IsString()
  @IsNotEmpty()
  business_name: string;
}

export enum OnboardingProcesses {
  BUSINESS_DETAILS = 'BUSINESS_DETAILS',
  KYC = 'KYC',
  WITHDRAWAL_ACCOUNT = 'WITHDRAWAL_ACCOUNT',
  TEAM_MEMBERS_INVITATION = 'TEAM_MEMBERS_INVITATION',
  PRODUCT_CREATION = 'PRODUCT_CREATION',
}

export class UpdateBusinessProcessesDto {
  @IsEnum(OnboardingProcesses)
  @IsNotEmpty()
  process: OnboardingProcesses;
}
