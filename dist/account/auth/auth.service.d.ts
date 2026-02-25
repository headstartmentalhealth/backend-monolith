import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpStatus, Logger } from '@nestjs/common';
import { EmailVerification, Prisma, Profile, User, Role as DBRole } from '@prisma/client';
import { LoginDto, RegisterCustomerDto, RegisterUserDto, RequestPasswordResetDto, ResendEmailDto, ResetPasswordDto, ResolveAccountDto, SavePersonalInfoDto, TokenDto, UpdateNameDto, UpdatePasswordDto, VerifyEmailAndSavePasswordDto, VerifyEmailDto, VerifyOtpDto } from './auth.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias } from '../../generic/generic.payload';
import { LoginPayload } from './auth.payload';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '../../rbac/rbac.service';
import { EmailDto } from '../../generic/generic.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { SSODto } from './sso.dto';
import { GoogleSSOService } from './providers/sso/google.provider';
import { CartService } from '@/cart/cart.service';
export declare class AuthService {
    private readonly prisma;
    private readonly logService;
    private readonly mailService;
    private readonly configService;
    private readonly jwtService;
    private readonly roleService;
    private readonly cartService;
    private readonly logger;
    private readonly paystackService;
    private readonly googleSSOService;
    private readonly model;
    private readonly userRepository;
    private readonly emailVerificationRepository;
    private rateLimiter;
    private readonly otpRepository;
    private readonly profileRepository;
    constructor(prisma: PrismaService, logService: LogService, mailService: MailService, configService: ConfigService, jwtService: JwtService, roleService: RoleService, cartService: CartService, logger: Logger, paystackService: PaystackService, googleSSOService: GoogleSSOService);
    register(registerUserDto: RegisterUserDto, request: Request): Promise<GenericPayloadAlias<{
        is_first_signup: boolean;
        user_id: string;
        email: string;
    }>>;
    private generateAuthTokenAndPayload;
    private verifyEmailLogic;
    private handleEmailVerification;
    verifyEmail(verifyEmailDto: VerifyEmailDto, request?: Request): Promise<GenericPayload | LoginPayload>;
    resendEmailVerification(resendEmailDto: ResendEmailDto, request: Request): Promise<GenericPayload>;
    requestOtp(loginDto: LoginDto): Promise<GenericPayload>;
    verifyOtp(verifyOtpDto: VerifyOtpDto, request: Request): Promise<LoginPayload>;
    requestUserOtp(loginDto: LoginDto): Promise<GenericPayload>;
    signin(loginDto: LoginDto, request: Request): Promise<LoginPayload>;
    logout(user: any): Promise<GenericPayload>;
    verifyUserOtp(verifyOtpDto: VerifyOtpDto, request: Request): Promise<LoginPayload>;
    sso(request: Request, ssoDto: SSODto): Promise<{
        statusCode: HttpStatus;
        message: string;
        accessToken: string;
        data: {
            role: string;
        };
    }>;
    saveOnLogin(user: User): Promise<void>;
    generateToken(user: User & {
        role: DBRole;
    } & {
        profile: Profile;
    }): Promise<{
        statusCode: HttpStatus;
        message: string;
        accessToken: string;
        data: {
            role: string;
        };
    }>;
    requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto): Promise<GenericPayload>;
    verifyPasswordResetToken(tokenDto: TokenDto): Promise<GenericPayloadAlias<{
        userId: string;
        email: string;
    }>>;
    resetPassword(resetPasswordDto: ResetPasswordDto, request: Request): Promise<GenericPayload>;
    getProfile(data: AuthPayload['user']): Promise<GenericDataPayload<User & {
        accessible_businesses?: any[];
    }>>;
    private getAccessibleBusinesses;
    updateName(auth: AuthPayload['user'], updateNameDto: UpdateNameDto): Promise<GenericPayload>;
    requestEmailUpdateOtp(auth: AuthPayload['user'], emailDto: EmailDto): Promise<GenericPayload>;
    verifyAndUpdateEmail(auth: AuthPayload['user'], verifyOtpDto: VerifyOtpDto): Promise<GenericPayload>;
    savePersonalInfo(auth: AuthPayload['user'], savePersonalInfoDto: SavePersonalInfoDto): Promise<GenericPayload>;
    registerCustomer(registerCustomerDto: RegisterCustomerDto, request: Request): Promise<GenericPayloadAlias<{
        id: string;
        name: string;
        email: string;
        phone: string;
        is_first_signup: boolean;
    }>>;
    verifyEmailAndSavePassword(request: Request, verifyEmailAndSavePasswordDto: VerifyEmailAndSavePasswordDto): Promise<GenericPayload>;
    verifyEmailToken(request: Request, tokenDto: TokenDto): Promise<GenericPayloadAlias<EmailVerification>>;
    requestNewAccountEmailToken(request: Request, emailDto: EmailDto): Promise<GenericPayloadAlias<EmailVerification>>;
    getUser(userRepo: Prisma.UserDelegate<DefaultArgs, Prisma.PrismaClientOptions>, user_id: string): Promise<{
        subscriptions: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            payment_method: import(".prisma/client").$Enums.PaymentMethod;
            auto_renew: boolean;
            business_id: string | null;
            user_id: string;
            currency: string;
            plan_id: string;
            plan_name_at_subscription: string;
            plan_price_at_subscription: Prisma.Decimal;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            billing_interval: import(".prisma/client").$Enums.SubscriptionPeriod;
            next_payment_date: Date | null;
            next_payment_amount: Prisma.Decimal | null;
            grace_end_date: Date;
            charge_auth_code: string | null;
        }[];
    } & {
        name: string;
        id: string;
        email: string;
        password_hash: string | null;
        phone: string | null;
        is_email_verified: boolean;
        is_phone_verified: boolean;
        is_first_signup: boolean;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        role_identity: string | null;
        is_suspended: boolean | null;
        suspended_by: string | null;
        suspended_at: Date | null;
        suspension_reason: string | null;
        signin_option: string | null;
        alternative_phone: string | null;
        referral_source: string | null;
    }>;
    getUserByEmail(userRepo: Prisma.UserDelegate<DefaultArgs, Prisma.PrismaClientOptions>, email: string): Promise<{
        subscriptions: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            payment_method: import(".prisma/client").$Enums.PaymentMethod;
            auto_renew: boolean;
            business_id: string | null;
            user_id: string;
            currency: string;
            plan_id: string;
            plan_name_at_subscription: string;
            plan_price_at_subscription: Prisma.Decimal;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            billing_interval: import(".prisma/client").$Enums.SubscriptionPeriod;
            next_payment_date: Date | null;
            next_payment_amount: Prisma.Decimal | null;
            grace_end_date: Date;
            charge_auth_code: string | null;
        }[];
    } & {
        name: string;
        id: string;
        email: string;
        password_hash: string | null;
        phone: string | null;
        is_email_verified: boolean;
        is_phone_verified: boolean;
        is_first_signup: boolean;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        role_identity: string | null;
        is_suspended: boolean | null;
        suspended_by: string | null;
        suspended_at: Date | null;
        suspension_reason: string | null;
        signin_option: string | null;
        alternative_phone: string | null;
        referral_source: string | null;
    }>;
    saveProfileInfo(auth: AuthPayload['user'], savePersonalInfoDto: SavePersonalInfoDto): Promise<GenericPayloadAlias<User & {
        profile: Profile;
    }>>;
    updatePassword(request: AuthPayload & Request, updatePasswordDto: UpdatePasswordDto): Promise<GenericPayload>;
    fetchBanks(): Promise<{
        statusCode: HttpStatus;
        data: any;
    }>;
    resolveAccountNumber(resolveAccountDto: ResolveAccountDto): Promise<{
        statusCode: HttpStatus;
        data: any;
    }>;
    getFirstSignupStatus(userId: string): Promise<{
        is_first_signup: boolean;
    }>;
    deleteAccount(auth: AuthPayload['user']): Promise<GenericPayload>;
}
