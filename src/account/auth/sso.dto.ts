import { Role } from '@/generic/generic.data';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
}

export enum SigninOption {
  INTERNAL = 'INTERNAL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum SigninOptionProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum OnboardActionType {
  SIGNUP = 'SIGNUP',
  SIGNIN = 'SIGNIN',
}

export class SSODto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(SigninOptionProvider)
  provider: SigninOptionProvider;

  @IsOptional()
  @IsEnum(Platform)
  platform: Platform;

  @IsEnum(Role)
  @IsOptional()
  role: Role;

  @IsEnum(OnboardActionType)
  @IsOptional()
  action_type: OnboardActionType;
}

export enum PlatformTypes {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class AppleSSODto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsString()
  @IsEnum(PlatformTypes)
  platform?: PlatformTypes;
}
