import { AddMultipleToCartDto } from '@/cart/cart.dto';
import { Role } from '@/generic/generic.data';
import { EmailDto } from '@/generic/generic.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Gender } from '@prisma/client';
import {
  Equals,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
  NotEquals,
} from 'class-validator';

// For business owner
export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  country: string;

  @IsNotEmpty()
  country_dial_code: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsBoolean()
  allowOtp: boolean;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ResendEmailDto extends EmailDto {
  @IsOptional()
  @IsBoolean()
  allowOtp?: boolean;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  reset_token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new_password: string;
}

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long.' })
  new_name: string;
}

export class SavePersonalInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMobilePhone()
  phone?: string;

  @IsOptional()
  @IsString()
  profile_picture?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsOptional()
  @IsEnum(Gender, {
    message: 'Gender must be one of: male, female.',
  })
  gender?: Gender;
}

export class RegisterCustomerDto extends PartialType(AddMultipleToCartDto) {
  @IsString()
  @IsNotEmpty()
  business_id: string; // business id or business slug

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class VerifyEmailAndSavePasswordDto {
  @IsNotEmpty()
  @IsUUID()
  token: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdatePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @MinLength(8)
  @NotEquals('current_password', {
    message: 'New password must be different from current password',
  })
  new_password: string;

  @IsString()
  @MinLength(8)
  confirm_password: string;
}

export class TokenDto {
  @IsString()
  token: string;
}

export class ResolveAccountDto {
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  bank_code: string;
}
