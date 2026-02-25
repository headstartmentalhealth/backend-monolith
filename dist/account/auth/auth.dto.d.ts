import { AddMultipleToCartDto } from '@/cart/cart.dto';
import { Role } from '@/generic/generic.data';
import { EmailDto } from '@/generic/generic.dto';
import { Gender } from '@prisma/client';
export declare class RegisterUserDto {
    name: string;
    email: string;
    phone: string;
    country: string;
    country_dial_code: string;
    password: string;
    allowOtp: boolean;
    role: Role;
}
export declare class VerifyEmailDto {
    token: string;
    email?: string;
}
export declare class ResendEmailDto extends EmailDto {
    allowOtp?: boolean;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class RequestPasswordResetDto {
    email: string;
}
export declare class ResetPasswordDto {
    reset_token: string;
    new_password: string;
}
export declare class UpdateNameDto {
    new_name: string;
}
export declare class SavePersonalInfoDto {
    name?: string;
    phone?: string;
    profile_picture?: string;
    address?: string;
    bio?: string;
    date_of_birth?: string;
    gender?: Gender;
}
declare const RegisterCustomerDto_base: import("@nestjs/mapped-types").MappedType<Partial<AddMultipleToCartDto>>;
export declare class RegisterCustomerDto extends RegisterCustomerDto_base {
    business_id: string;
    name: string;
    email: string;
    phone: string;
}
export declare class VerifyEmailAndSavePasswordDto {
    token: string;
    password: string;
}
export declare class UpdatePasswordDto {
    current_password: string;
    new_password: string;
    confirm_password: string;
}
export declare class TokenDto {
    token: string;
}
export declare class ResolveAccountDto {
    account_number: string;
    bank_code: string;
}
export {};
