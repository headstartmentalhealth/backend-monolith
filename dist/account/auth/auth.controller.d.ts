import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterCustomerDto, RegisterUserDto, RequestPasswordResetDto, ResendEmailDto, ResetPasswordDto, ResolveAccountDto, SavePersonalInfoDto, TokenDto, UpdateNameDto, UpdatePasswordDto, VerifyEmailAndSavePasswordDto, VerifyEmailDto, VerifyOtpDto } from './auth.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias } from '../../generic/generic.payload';
import { LoginPayload } from './auth.payload';
import { EmailVerification, Profile, User } from '@prisma/client';
import { EmailDto } from '@/generic/generic.dto';
import { SSODto } from './sso.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerUserDto: RegisterUserDto, request: Request): Promise<GenericPayloadAlias<{
        is_first_signup: boolean;
        user_id: string;
        email: string;
    }>>;
    registerEmail(resendEmailDto: ResendEmailDto, request: Request): Promise<GenericPayload>;
    verifyEmail(verifyEmailDto: VerifyEmailDto, request: Request): Promise<GenericPayload | LoginPayload>;
    requestOtp(loginDto: LoginDto): Promise<GenericPayload>;
    verifyOtp(verifyOtpDto: VerifyOtpDto, request: Request): Promise<LoginPayload>;
    signin(loginDto: LoginDto, request: Request): Promise<LoginPayload>;
    logout(req: AuthPayload): Promise<GenericPayload>;
    requestUserOtp(loginDto: LoginDto): Promise<GenericPayload>;
    verifyUserOtp(verifyOtpDto: VerifyOtpDto, request: Request): Promise<LoginPayload>;
    sso(request: Request, ssoDto: SSODto): Promise<{
        statusCode: HttpStatus;
        message: string;
        accessToken: string;
        data: {
            role: string;
        };
    }>;
    requestPasswordRequest(requestPasswordResetDto: RequestPasswordResetDto): Promise<GenericPayload>;
    verifyPasswordToken(tokenDto: TokenDto): Promise<GenericPayloadAlias<{
        userId: string;
        email: string;
    }>>;
    resetPassword(resetPasswordDto: ResetPasswordDto, request: Request): Promise<GenericPayload>;
    viewProfile(req: AuthPayload): Promise<GenericDataPayload<User>>;
    updateName(req: AuthPayload, updateNameDto: UpdateNameDto): Promise<GenericPayload>;
    requestEmailUpdate(req: AuthPayload, emailDto: EmailDto): Promise<GenericPayload>;
    verifyAndUpdateEmail(req: AuthPayload, verifyOtpDto: VerifyOtpDto): Promise<GenericPayload>;
    savePersonalInfo(req: AuthPayload, savePersonalInfoDto: SavePersonalInfoDto): Promise<GenericPayload>;
    registerCustomer(registerCustomerDto: RegisterCustomerDto, request: Request): Promise<GenericPayloadAlias<{
        id: string;
        name: string;
        email: string;
        phone: string;
        is_first_signup: boolean;
    }>>;
    verifyEmailAndSavePassword(request: Request, verifyEmailAndSavePasswordDto: VerifyEmailAndSavePasswordDto): Promise<GenericPayload>;
    verifyEmailToken(request: Request, tokenDto: TokenDto): Promise<GenericPayloadAlias<EmailVerification>>;
    requestNewAccountEmailToken(request: Request, emailDto: EmailDto): Promise<GenericPayload>;
    saveProfileInfo(req: AuthPayload, savePersonalInfoDto: SavePersonalInfoDto): Promise<GenericPayloadAlias<User & {
        profile: Profile;
    }>>;
    updatePassword(req: AuthPayload & Request, updatePasswordDto: UpdatePasswordDto): Promise<GenericPayload>;
    getFirstSignupStatus(req: AuthPayload): Promise<GenericDataPayload<{
        is_first_signup: boolean;
    }>>;
    fetchBanks(req: AuthPayload & Request): Promise<GenericDataPayload<any>>;
    resolveAccount(dto: ResolveAccountDto): Promise<{
        statusCode: HttpStatus;
        data: any;
    }>;
    deleteAccount(req: AuthPayload): Promise<GenericPayload>;
}
