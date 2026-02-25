"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const log_service_1 = require("../../log/log.service");
const mail_service_1 = require("../../notification/mail/mail.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const generic_utils_1 = require("../../generic/generic.utils");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const rbac_service_1 = require("../../rbac/rbac.service");
const generic_data_1 = require("../../generic/generic.data");
const moment = require("moment");
const paystack_provider_1 = require("../../generic/providers/paystack/paystack.provider");
const sso_dto_1 = require("./sso.dto");
const google_provider_1 = require("./providers/sso/google.provider");
const cart_service_1 = require("../../cart/cart.service");
let AuthService = class AuthService {
    constructor(prisma, logService, mailService, configService, jwtService, roleService, cartService, logger, paystackService, googleSSOService) {
        this.prisma = prisma;
        this.logService = logService;
        this.mailService = mailService;
        this.configService = configService;
        this.jwtService = jwtService;
        this.roleService = roleService;
        this.cartService = cartService;
        this.logger = logger;
        this.paystackService = paystackService;
        this.googleSSOService = googleSSOService;
        this.model = 'User';
        this.userRepository = new prisma_base_repository_1.PrismaBaseRepository('user', prisma);
        this.emailVerificationRepository = new prisma_base_repository_1.PrismaBaseRepository('emailVerification', prisma);
        this.rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
            points: 5,
            duration: 600,
        });
        this.otpRepository = new prisma_base_repository_1.PrismaBaseRepository('otp', prisma);
        this.profileRepository = new prisma_base_repository_1.PrismaBaseRepository('profile', prisma);
    }
    async register(registerUserDto, request) {
        const { name, email, phone, country, country_dial_code, password, allowOtp, role, } = registerUserDto;
        const allowedRoles = [generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.USER];
        if (!allowedRoles.includes(role)) {
            throw new common_1.ForbiddenException(`Forbidden resource: Only ${allowedRoles.join(', ')} accounts can be registered.`);
        }
        const include = { role: true };
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] },
            include,
        });
        const isFirstSignup = !existingUser;
        if (existingUser) {
            if (existingUser.is_email_verified) {
                if (existingUser.role.role_id !== role) {
                    throw new common_1.ConflictException('This email address has already been registered under a different account type.');
                }
                throw new common_1.ConflictException('Email address is already in use.');
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const role_identity = await this.roleService.fetchOne(role);
        let user;
        if (existingUser) {
            user = await this.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    name,
                    password_hash: hashedPassword,
                    role_identity: role_identity.id,
                    is_first_signup: isFirstSignup,
                },
                include,
            });
        }
        else {
            user = await this.prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password_hash: hashedPassword,
                    role_identity: role_identity.id,
                    is_first_signup: true,
                },
                include,
            });
        }
        await this.profileRepository.create({
            user: { connect: { id: user.id } },
            country_code: country,
            country_dial_code,
        });
        const verificationToken = allowOtp ? (0, generic_utils_1.generateOtp)() : (0, uuid_1.v4)();
        const expiresAt = moment()
            .add(allowOtp ? 5 : 60, 'minutes')
            .toDate();
        await this.emailVerificationRepository.upsert({
            where: { user_id: user.id },
            create: {
                user: { connect: { id: user.id } },
                verification_token: verificationToken,
                expires_at: expiresAt,
                is_verified: false,
            },
            update: {
                verification_token: verificationToken,
                expires_at: expiresAt,
                is_verified: false,
            },
        });
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.CREATE,
            entity: 'User',
            entity_id: user.id,
            metadata: `User[${role}] with email ${email} registered successfully.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        await this.mailService.emailVerification(user, {
            token: verificationToken,
            allowOtp,
        });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: allowOtp
                ? 'Success! Please check your email to verify your account.'
                : 'Success! Please check your email for verification.',
            data: {
                is_first_signup: user.is_first_signup ?? isFirstSignup,
                user_id: user.id,
                email: user.email,
            },
        };
    }
    async generateAuthTokenAndPayload(user, request) {
        const payload = {
            sub: user.id,
            name: user.name,
            email: user.email,
            role: user.role.role_id,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRY'),
        });
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.LOGIN,
            entity: 'User',
            entity_id: user.id,
            metadata: `User[${user.role.role_id}] with email ${user.email} logged in successfully after email verification.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        return {
            statusCode: 200,
            message: 'Email verified and login successful.',
            accessToken,
            data: {
                role: user.role.role_id,
            },
        };
    }
    async verifyEmailLogic(verifyEmailDto, omitUpdate, request, generateAuth) {
        const { token, email } = verifyEmailDto;
        const includes = {
            user: {
                include: { role: true },
            },
        };
        const emailVerification = await this.emailVerificationRepository.findOne({
            verification_token: token,
            ...(email && {
                user: {
                    email,
                },
            }),
        }, includes);
        if (!emailVerification) {
            throw new common_1.BadRequestException('Invalid or non-existent verification code.');
        }
        if (emailVerification.is_verified) {
            return emailVerification;
        }
        if (moment(emailVerification.expires_at).isBefore(moment())) {
            throw new common_1.BadRequestException('Verification code has expired.');
        }
        await this.emailVerificationRepository.update({ verification_token: token, ...(email && { user: { email } }) }, { is_verified: true });
        if (!omitUpdate) {
            await this.userRepository.update({ id: emailVerification.user_id }, {
                is_email_verified: true,
                is_first_signup: false,
            });
            await this.mailService.verifiedEmail(emailVerification.user);
            if (generateAuth && emailVerification.user.is_first_signup && request) {
                return await this.generateAuthTokenAndPayload(emailVerification.user, request);
            }
        }
        return emailVerification;
    }
    async handleEmailVerification(dto, options = {}) {
        const { token, email } = dto;
        const { omitUserUpdate = false, request, generateAuth = false } = options;
        const includeRelations = {
            user: { include: { role: true } },
        };
        const emailVerification = await this.emailVerificationRepository.findOne({
            verification_token: token,
            ...(email && { user: { email } }),
        }, includeRelations);
        if (!emailVerification) {
            throw new common_1.BadRequestException('Invalid or non-existent verification code.');
        }
        if (emailVerification.is_verified) {
            return {
                statusCode: common_1.HttpStatus.CONFLICT,
                message: 'Email is already verified.',
            };
        }
        const isExpired = moment(emailVerification.expires_at).isBefore(moment());
        if (isExpired) {
            throw new common_1.BadRequestException({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Verification code has expired.',
                data: {
                    expires_at: emailVerification.expires_at,
                    is_verified: emailVerification.is_verified,
                    created_at: emailVerification.created_at,
                    expired: true,
                    email: emailVerification.user.email,
                },
            });
        }
        await this.emailVerificationRepository.update({
            verification_token: token,
            ...(email && { user: { email } }),
        }, { is_verified: true });
        if (!omitUserUpdate) {
            await this.userRepository.update({ id: emailVerification.user_id }, {
                is_email_verified: true,
                is_first_signup: false,
            });
            await this.mailService.verifiedEmail(emailVerification.user);
            if (generateAuth && emailVerification.user.is_first_signup && request) {
                return await this.generateAuthTokenAndPayload(emailVerification.user, request);
            }
        }
        return emailVerification;
    }
    async verifyEmail(verifyEmailDto, request) {
        const response = await this.verifyEmailLogic(verifyEmailDto, false, request, true);
        if ('accessToken' in response) {
            return response;
        }
        if ('statusCode' in response && 'message' in response) {
            return {
                statusCode: response.statusCode || common_1.HttpStatus.OK,
                message: response.message || 'Email successfully verified.',
            };
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Email successfully verified.',
        };
    }
    async resendEmailVerification(resendEmailDto, request) {
        const { email, allowOtp } = resendEmailDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.BadRequestException('User with this email does not exist.');
        }
        const emailVerification = await this.prisma.emailVerification.findUnique({
            where: { user_id: user.id },
        });
        if (emailVerification?.is_verified) {
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Email is already verified.',
            };
        }
        if (!emailVerification ||
            moment(emailVerification.expires_at).isBefore(moment())) {
            let newToken = (0, uuid_1.v4)();
            let newExpiresAt = moment().add(1, 'hour').toDate();
            if (allowOtp) {
                newToken = (0, generic_utils_1.generateOtp)();
                newExpiresAt = moment().add(5, 'minutes').toDate();
            }
            if (emailVerification) {
                await this.prisma.emailVerification.update({
                    where: { user_id: user.id },
                    data: {
                        verification_token: newToken,
                        expires_at: newExpiresAt,
                        is_verified: false,
                    },
                });
            }
            else {
                await this.prisma.emailVerification.create({
                    data: {
                        user_id: user.id,
                        verification_token: newToken,
                        expires_at: newExpiresAt,
                        is_verified: false,
                    },
                });
            }
            await this.logService.createLog({
                user_id: user.id,
                action: client_1.Action.RESEND_VERIFICATION,
                entity: 'EmailVerification',
                entity_id: user.id,
                metadata: `New email verification token generated for user with email ${email}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            });
            await this.mailService.emailVerification(user, {
                token: newToken,
                allowOtp,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'A new verification email has been sent. Please check your inbox.',
            };
        }
        await this.mailService.resendEmailVerification(user, emailVerification.verification_token, allowOtp);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Verification email resent successfully. Please check your inbox.',
        };
    }
    async requestOtp(loginDto) {
        const { email, password } = loginDto;
        const includes = { role: true };
        const user = await this.userRepository.findOne({
            email,
        }, includes);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        (0, generic_utils_1.onlyOwnerLogin)(user.role.role_id);
        const otp = (0, generic_utils_1.generateOtp)();
        const expiresAt = moment().add(5, 'minutes').toDate();
        await this.otpRepository.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                otp,
                expires_at: expiresAt,
            },
            update: {
                otp,
                expires_at: expiresAt,
            },
        });
        await this.mailService.loginRequest(user, otp);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'OTP sent to your email. Please verify it to log in.',
        };
    }
    async verifyOtp(verifyOtpDto, request) {
        const { email, otp } = verifyOtpDto;
        const includes = { user: { include: { role: true } } };
        const otpRecord = await this.otpRepository.findOne({
            user: { email },
            otp,
        }, includes);
        if (!otpRecord) {
            throw new common_1.BadRequestException('Invalid OTP.');
        }
        (0, generic_utils_1.onlyOwnerLogin)(otpRecord.user.role.role_id);
        if (moment(otpRecord.expires_at).isBefore(moment())) {
            throw new common_1.BadRequestException('OTP has expired.');
        }
        const payload = {
            sub: otpRecord.user.id,
            name: otpRecord.user.name,
            email: otpRecord.user.email,
            role: otpRecord.user.role.role_id,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRY'),
        });
        await this.logService.createLog({
            user_id: otpRecord.user.id,
            action: client_1.Action.LOGIN,
            entity: 'User',
            entity_id: otpRecord.user.id,
            metadata: `User[${otpRecord.user.role.role_id}] with email ${otpRecord.user.email} logged in successfully.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        await this.otpRepository.forceDelete({ id: otpRecord.id });
        return {
            statusCode: 200,
            message: 'Login successful.',
            accessToken,
            data: {
                role: otpRecord.user.role.role_id,
            },
        };
    }
    async requestUserOtp(loginDto) {
        const { email, password } = loginDto;
        try {
            await this.rateLimiter.consume(email);
        }
        catch {
            throw new common_1.BadRequestException('Too many login attempts. Please try again later.');
        }
        const includes = { role: true };
        const user = await this.userRepository.findOne({
            email,
        }, includes);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.signin_option !== sso_dto_1.SigninOption.INTERNAL) {
            throw new common_1.UnauthorizedException(`This account was registered with ${user.signin_option.toLowerCase()}. Please sign in using ${user.signin_option.toLowerCase()}.`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const otp = (0, generic_utils_1.generateOtp)();
        const expiresAt = moment().add(5, 'minutes').toDate();
        await this.otpRepository.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                otp,
                expires_at: expiresAt,
            },
            update: {
                otp,
                expires_at: expiresAt,
            },
        });
        await this.mailService.loginRequest(user, otp);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'OTP sent to your email. Please verify it to log in.',
        };
    }
    async signin(loginDto, request) {
        const { email, password } = loginDto;
        const includes = { role: true };
        const user = await this.userRepository.findOne({ email }, includes);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.signin_option !== sso_dto_1.SigninOption.INTERNAL) {
            throw new common_1.UnauthorizedException(`This account was registered with ${user.signin_option.toLowerCase()}. Please sign in using ${user.signin_option.toLowerCase()}.`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (!user.is_email_verified) {
            throw new common_1.UnauthorizedException('Email address not verified. Please verify your email to log in.');
        }
        return await this.generateAuthTokenAndPayload(user, request);
    }
    async logout(user) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Logged out successfully.',
        };
    }
    async verifyUserOtp(verifyOtpDto, request) {
        const { email, otp } = verifyOtpDto;
        const includes = { user: { include: { role: true } } };
        const otpRecord = await this.otpRepository.findOne({
            user: { email },
            otp,
        }, includes);
        if (!otpRecord) {
            throw new common_1.BadRequestException('Invalid OTP.');
        }
        if (moment(otpRecord.expires_at).isBefore(moment())) {
            throw new common_1.BadRequestException('OTP has expired.');
        }
        const payload = {
            sub: otpRecord.user.id,
            name: otpRecord.user.name,
            email: otpRecord.user.email,
            role: otpRecord.user.role.role_id,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRY'),
        });
        await this.logService.createLog({
            user_id: otpRecord.user.id,
            action: client_1.Action.LOGIN,
            entity: 'User',
            entity_id: otpRecord.user.id,
            metadata: `User[${otpRecord.user.role.role_id}] with email ${otpRecord.user.email} logged in successfully.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        await this.otpRepository.forceDelete({ id: otpRecord.id });
        return {
            statusCode: 200,
            message: 'Login successful.',
            accessToken,
            data: {
                role: otpRecord.user.role.role_id,
            },
        };
    }
    async sso(request, ssoDto) {
        const { provider, token, platform, role: roleId, action_type } = ssoDto;
        if (provider !== sso_dto_1.SigninOptionProvider.GOOGLE) {
            throw new common_1.BadRequestException('Unsupported SSO provider');
        }
        const ssoPayload = await this.googleSSOService.verify(token, platform);
        const includes = {
            role: true,
            profile: true,
        };
        let user = await this.userRepository.findOne({ email: ssoPayload.email }, includes);
        if (user && action_type === sso_dto_1.OnboardActionType.SIGNUP) {
            throw new common_1.BadRequestException('You have already registered your account. Please sign in to continue.');
        }
        let role = null;
        if (roleId) {
            role = await this.prisma.role.findFirst({
                where: { role_id: roleId },
            });
            if (!role)
                throw new common_1.NotFoundException('Role not found');
        }
        if (action_type === sso_dto_1.OnboardActionType.SIGNIN) {
            if (user) {
                if (user.signin_option !== provider) {
                    throw new common_1.BadRequestException(`Account was not registered with ${provider}`);
                }
                if (!user.is_email_verified) {
                    throw new common_1.UnauthorizedException('Your account has not been verified.');
                }
                if (user.is_suspended) {
                    throw new common_1.UnauthorizedException('Your account has been suspended.');
                }
            }
            else {
                throw new common_1.NotFoundException(`You have to register your account first.`);
            }
        }
        else if (action_type === sso_dto_1.OnboardActionType.SIGNUP) {
            const newUserPayload = {
                name: ssoPayload.given_name,
                email: ssoPayload.email,
                is_email_verified: ssoPayload.email_verified || ssoPayload.verified_email,
                signin_option: provider,
                ...(role && { role_identity: role?.id }),
            };
            user = await this.prisma.user.create({
                data: newUserPayload,
                include: includes,
            });
        }
        else {
            throw new common_1.BadRequestException('Invalid signup action type. Please use SIGNIN or SIGNUP.');
        }
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.LOGIN,
            entity: 'User',
            entity_id: user.id,
            metadata: `User[${user.role?.role_id}] with email ${user.email} logged in via ${provider} successfully.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        await this.saveOnLogin(user);
        return this.generateToken(user);
    }
    async saveOnLogin(user) {
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                updated_at: new Date(),
            },
        });
    }
    async generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role.role_id,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRY'),
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Login successful',
            accessToken: accessToken,
            data: {
                role: user.role?.role_id,
            },
        };
    }
    async requestPasswordReset(requestPasswordResetDto) {
        const { email } = requestPasswordResetDto;
        try {
            await this.rateLimiter.consume(email);
        }
        catch {
            throw new common_1.BadRequestException('Too many attempts. Please try again later.');
        }
        const includes = { role: true };
        const user = await this.userRepository.findOne({ email }, includes);
        if (!user) {
            throw new common_1.BadRequestException('Email address does not exist.');
        }
        const resetToken = this.jwtService.sign({ sub: user.id, email: user.email }, {
            secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
            expiresIn: '15m',
        });
        await this.mailService.requestPasswordReset(user, resetToken);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Password reset email sent successfully. Please check your mailbox',
        };
    }
    async verifyPasswordResetToken(tokenDto) {
        try {
            const { token } = tokenDto;
            const decoded = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
            });
            const user = await this.userRepository.findOne({ id: decoded.sub, email: decoded.email }, { role: true });
            if (!user) {
                throw new common_1.BadRequestException('Invalid or expired token.');
            }
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Token is valid.',
                data: { userId: user.id, email: user.email },
            };
        }
        catch (err) {
            throw new common_1.BadRequestException('Invalid or expired token.');
        }
    }
    async resetPassword(resetPasswordDto, request) {
        const { reset_token, new_password } = resetPasswordDto;
        let payload;
        try {
            payload = this.jwtService.verify(reset_token, {
                secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
            });
        }
        catch {
            throw new common_1.BadRequestException('Invalid or expired reset token.');
        }
        const user = await this.userRepository.findOne({ id: payload.sub });
        if (!user) {
            throw new common_1.BadRequestException('User not found.');
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await this.userRepository.update({ id: user.id }, { password_hash: hashedPassword });
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.RESET_PASSWORD,
            entity: 'User',
            entity_id: user.id,
            metadata: `User with email ${user.email} has reset password successfully.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        await this.mailService.updatedPassword(user);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Password reset successfully.',
        };
    }
    async getProfile(data) {
        const { sub } = data;
        const select = {
            id: true,
            name: true,
            email: true,
            phone: true,
            is_email_verified: true,
            is_phone_verified: true,
            created_at: true,
            updated_at: true,
            role: {
                select: {
                    name: true,
                    role_id: true,
                },
            },
            profile: {
                select: {
                    bio: true,
                    address: true,
                    profile_picture: true,
                    gender: true,
                    date_of_birth: true,
                },
            },
        };
        const user = await this.userRepository.findOne({ id: sub }, undefined, select);
        const accessibleBusinesses = await this.getAccessibleBusinesses(sub);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                ...user,
                accessible_businesses: accessibleBusinesses,
            },
        };
    }
    async getAccessibleBusinesses(userId) {
        const now = new Date();
        const businessesWithPayments = await this.prisma.payment.findMany({
            where: {
                user_id: userId,
                payment_status: client_1.PaymentStatus.SUCCESS,
                purchase_type: {
                    in: [
                        client_1.PurchaseType.COURSE,
                        client_1.PurchaseType.TICKET,
                        client_1.PurchaseType.PRODUCT,
                        client_1.PurchaseType.SUBSCRIPTION,
                    ],
                },
                purchase: {
                    path: ['business_id'],
                    not: null,
                },
            },
            select: {
                purchase: true,
                purchase_type: true,
                created_at: true,
            },
        });
        const businessesAsContact = await this.prisma.businessContact.findMany({
            where: {
                user_id: userId,
                role: 'user',
                status: client_1.MemberStatus.active,
            },
            include: {
                business: {
                    select: {
                        id: true,
                        business_name: true,
                        industry: true,
                        logo_url: true,
                        created_at: true,
                    },
                },
            },
        });
        const businessesWithSubscriptions = await this.prisma.subscription.findMany({
            where: {
                user_id: userId,
                is_active: true,
                end_date: {
                    gte: now,
                },
            },
            include: {
                subscription_plan: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        business: {
                            select: {
                                id: true,
                                business_name: true,
                                industry: true,
                                logo_url: true,
                                created_at: true,
                            },
                        },
                    },
                },
            },
        });
        const businessMap = new Map();
        businessesWithPayments.forEach((payment) => {
            if (payment.purchase &&
                typeof payment.purchase === 'object' &&
                'business_id' in payment.purchase) {
                const purchaseData = payment.purchase;
                businessMap.set(purchaseData.business_id, {
                    business_id: purchaseData.business_id,
                    access_type: 'purchase',
                    access_date: payment.created_at,
                    purchase_type: payment.purchase_type,
                });
            }
        });
        businessesAsContact.forEach((contact) => {
            const businessId = contact.business.id;
            if (!businessMap.has(businessId)) {
                businessMap.set(businessId, {
                    business_id: businessId,
                    business: contact.business,
                    access_type: 'contact',
                    access_date: contact.joined_at,
                    role: contact.role,
                });
            }
        });
        businessesWithSubscriptions.forEach((subscription) => {
            const businessId = subscription.subscription_plan.business.id;
            const existing = businessMap.get(businessId);
            if (existing) {
                existing.active_subscription = {
                    id: subscription.id,
                    plan_name: subscription.plan_name_at_subscription,
                    plan_price: subscription.plan_price_at_subscription,
                    start_date: subscription.start_date,
                    end_date: subscription.end_date,
                    auto_renew: subscription.auto_renew,
                    days_until_expiry: Math.ceil((new Date(subscription.end_date).getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)),
                    is_expiring_soon: Math.ceil((new Date(subscription.end_date).getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)) <= 7,
                    status: 'active',
                    subscription_plan: subscription.subscription_plan,
                };
                existing.access_type = 'subscription';
            }
            else {
                businessMap.set(businessId, {
                    business_id: businessId,
                    business: subscription.subscription_plan.business,
                    access_type: 'subscription',
                    access_date: subscription.created_at,
                    active_subscription: {
                        id: subscription.id,
                        plan_name: subscription.plan_name_at_subscription,
                        plan_price: subscription.plan_price_at_subscription,
                        start_date: subscription.start_date,
                        end_date: subscription.end_date,
                        auto_renew: subscription.auto_renew,
                        days_until_expiry: Math.ceil((new Date(subscription.end_date).getTime() - now.getTime()) /
                            (1000 * 60 * 60 * 24)),
                        is_expiring_soon: Math.ceil((new Date(subscription.end_date).getTime() - now.getTime()) /
                            (1000 * 60 * 60 * 24)) <= 7,
                        status: 'active',
                        subscription_plan: subscription.subscription_plan,
                    },
                });
            }
        });
        const businesses = Array.from(businessMap.values());
        for (const business of businesses) {
            if (!business.business) {
                const businessDetails = await this.prisma.businessInformation.findUnique({
                    where: { id: business.business_id },
                    select: {
                        id: true,
                        business_name: true,
                        industry: true,
                        logo_url: true,
                        created_at: true,
                    },
                });
                business.business = businessDetails;
            }
        }
        return businesses;
    }
    async updateName(auth, updateNameDto) {
        const user = await this.userRepository.findOne({ id: auth.sub });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        await this.userRepository.update({ id: user.id }, { name: updateNameDto.new_name });
        return { statusCode: common_1.HttpStatus.OK, message: 'Name updated successfully.' };
    }
    async requestEmailUpdateOtp(auth, emailDto) {
        const { email } = emailDto;
        const existingUser = await this.userRepository.findOne({ email });
        if (existingUser) {
            throw new common_1.BadRequestException('Email address already in use.');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = moment().add(5, 'minutes').toDate();
        await this.otpRepository.upsert({
            where: { user_id: auth.sub },
            create: {
                user_id: auth.sub,
                otp,
                expires_at,
            },
            update: {
                otp,
                expires_at,
            },
        });
        await this.mailService.requestEmailUpdate({ name: auth.name, email: auth.email }, otp);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'OTP sent to the new email address.',
        };
    }
    async verifyAndUpdateEmail(auth, verifyOtpDto) {
        const { email, otp } = verifyOtpDto;
        const otpRecord = await this.otpRepository.findOne({
            user_id: auth.sub,
            otp,
            expires_at: { gte: new Date() },
        });
        if (!otpRecord) {
            throw new common_1.BadRequestException('Invalid or expired OTP.');
        }
        await this.userRepository.update({ id: auth.sub }, { email });
        await this.otpRepository.forceDelete({ user_id: auth.sub });
        await this.mailService.updatedEmail({
            name: auth.name,
            email: auth.email,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Email updated successfully.',
        };
    }
    async savePersonalInfo(auth, savePersonalInfoDto) {
        const { name, phone, address, bio, date_of_birth, gender, profile_picture } = savePersonalInfoDto;
        await this.prisma.$transaction(async (prisma) => {
            if (name || phone) {
                await prisma.user.update({
                    where: { id: auth.sub },
                    data: {
                        ...(name && { name }),
                        ...(phone && { phone }),
                    },
                });
            }
            await prisma.profile.upsert({
                where: { user_id: auth.sub },
                create: {
                    user_id: auth.sub,
                    address,
                    bio,
                    ...(date_of_birth && {
                        date_of_birth: new Date(date_of_birth).toISOString(),
                    }),
                    gender,
                    profile_picture,
                },
                update: {
                    address,
                    bio,
                    ...(date_of_birth && {
                        date_of_birth: new Date(date_of_birth).toISOString(),
                    }),
                    gender,
                    profile_picture,
                },
            });
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Personal information saved successfully.',
        };
    }
    async registerCustomer(registerCustomerDto, request) {
        const { name, email, phone, business_id } = registerCustomerDto;
        const business = await this.prisma.businessInformation.findFirst({
            where: { OR: [{ id: business_id }, { business_slug: business_id }] },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found.');
        }
        const { user, verificationToken, already_registered } = await this.prisma.$transaction(async (prisma) => {
            const role_identity = await this.roleService.fetchOneTrx(generic_data_1.Role.USER, prisma);
            const user = await prisma.user.upsert({
                where: { email },
                create: {
                    name,
                    email,
                    phone,
                    role_identity: role_identity.id,
                    is_first_signup: true,
                },
                update: {},
                include: { role: true, email_verification: true },
            });
            let existingContact = await prisma.businessContact.findFirst({
                where: {
                    business_id: business.id,
                    email: email,
                },
            });
            if (!existingContact) {
                existingContact = await prisma.businessContact.create({
                    data: {
                        business_id: business.id,
                        user_id: user.id,
                        role: generic_data_1.Role.USER,
                        email: user.email,
                        name: user.name,
                        joined_via: client_1.JoinedVia.PURCHASE,
                        status: 'active',
                    },
                });
            }
            let already_registered = false;
            const verificationToken = (0, uuid_1.v4)();
            const expiresAt = moment().add(1, 'hour').toDate();
            if (!user.email_verification) {
                await prisma.emailVerification.create({
                    data: {
                        user: { connect: { id: user.id } },
                        verification_token: verificationToken,
                        expires_at: expiresAt,
                        is_verified: false,
                    },
                });
            }
            else {
                already_registered = true;
            }
            if (registerCustomerDto?.items) {
                const auth = {
                    sub: user.id,
                    role: user.role.role_id,
                    email: user.email,
                    name: user.name,
                };
                await this.cartService.addItems(request, auth, { items: registerCustomerDto.items }, prisma);
            }
            await this.logService.createWithTrx({
                user_id: user.id,
                action: client_1.Action.CUSTOMER_REGISTRATION,
                entity: 'User',
                entity_id: user.id,
                metadata: `Customer with email ${email} registered successfully.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return { user, verificationToken, already_registered };
        });
        let message = 'Account already registered.';
        let statusCode = common_1.HttpStatus.OK;
        if (!already_registered) {
            message =
                'Account registered successfully. Please check your email for verification.';
            statusCode = common_1.HttpStatus.CREATED;
            await this.mailService.welcomeCustomerEmail(user, verificationToken);
        }
        return {
            statusCode,
            message,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.email,
                is_first_signup: user.is_first_signup ?? true,
            },
        };
    }
    async verifyEmailAndSavePassword(request, verifyEmailAndSavePasswordDto) {
        const { token, password } = verifyEmailAndSavePasswordDto;
        const email_verification = (await this.verifyEmailLogic({ token }, true, request, true));
        const hashed_password = await bcrypt.hash(password, 10);
        await this.userRepository.update({ id: email_verification.user_id }, {
            is_email_verified: true,
            password_hash: hashed_password,
            is_first_signup: false,
        });
        await this.emailVerificationRepository.update({
            id: email_verification.id,
        }, {
            verification_token: null,
            expires_at: null,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Email verified and password saved successfully.',
        };
    }
    async verifyEmailToken(request, tokenDto) {
        const { token } = tokenDto;
        const email_verification = (await this.handleEmailVerification({ token }, { omitUserUpdate: false, request, generateAuth: true }));
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Email verified successfully.',
        };
    }
    async requestNewAccountEmailToken(request, emailDto) {
        const { email } = emailDto;
        try {
            await this.rateLimiter.consume(email);
        }
        catch {
            throw new common_1.BadRequestException('Too many attempts. Please try again later.');
        }
        const includes = { role: true };
        const user = await this.userRepository.findOne({ email }, includes);
        if (!user) {
            throw new common_1.BadRequestException('Email address does not exist.');
        }
        if (user.password_hash) {
            throw new common_1.ForbiddenException('Account already has a password.');
        }
        const verificationToken = (0, uuid_1.v4)();
        const expiresAt = moment().add(24, 'hour').toDate();
        await this.prisma.emailVerification.upsert({
            where: { user_id: user.id },
            update: {
                verification_token: verificationToken,
                expires_at: expiresAt,
                is_verified: false,
                updated_at: new Date(),
            },
            create: {
                user_id: user.id,
                verification_token: verificationToken,
                expires_at: expiresAt,
                is_verified: false,
            },
        });
        await this.mailService.requestPasswordCreationLink(user, verificationToken);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Password creation email sent successfully. Please check your mailbox',
        };
    }
    async getUser(userRepo, user_id) {
        const user = await userRepo.findUnique({
            where: { id: user_id },
            include: { subscriptions: { where: { is_active: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException(`Account with '${user_id}' not found.`);
        }
        return user;
    }
    async getUserByEmail(userRepo, email) {
        const user = await userRepo.findUnique({
            where: { email },
            include: { subscriptions: { where: { is_active: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException(`Account with '${email}' not found.`);
        }
        return user;
    }
    async saveProfileInfo(auth, savePersonalInfoDto) {
        const { phone, address, bio, date_of_birth, gender, profile_picture } = savePersonalInfoDto;
        const user = await this.userRepository.update({ id: auth.sub }, {
            name: savePersonalInfoDto.name,
            phone,
        });
        const profile = await this.profileRepository.upsert({
            where: { user_id: auth.sub },
            create: {
                user_id: auth.sub,
                address,
                bio,
                ...(date_of_birth && {
                    date_of_birth: new Date(date_of_birth).toISOString(),
                }),
                gender,
                profile_picture,
            },
            update: {
                address,
                bio,
                ...(date_of_birth && {
                    date_of_birth: new Date(date_of_birth).toISOString(),
                }),
                gender,
                profile_picture,
            },
        });
        const account = await this.userRepository.findOne({ id: auth.sub }, { role: true });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Profile information saved successfully.',
            data: Object.assign({}, user, { profile }, { role: account.role }),
        };
    }
    async updatePassword(request, updatePasswordDto) {
        const auth = request.user;
        const { current_password, new_password, confirm_password } = updatePasswordDto;
        try {
            const { user } = await this.prisma.$transaction(async (prisma) => {
                if (new_password !== confirm_password) {
                    throw new common_1.UnprocessableEntityException('New password and confirmation do not match');
                }
                const user = await prisma.user.findUnique({
                    where: { id: auth.sub },
                });
                if (!user) {
                    throw new common_1.NotFoundException('Account not found');
                }
                const is_password_valid = await bcrypt.compare(current_password, user.password_hash);
                if (!is_password_valid) {
                    throw new common_1.BadRequestException('Current password is incorrect');
                }
                const saltRounds = 10;
                const hashed_password = await bcrypt.hash(new_password, saltRounds);
                await prisma.user.update({
                    where: { id: auth.sub },
                    data: { password_hash: hashed_password },
                });
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.RESET_PASSWORD,
                    entity: this.model,
                    entity_id: user.id,
                    metadata: `User with ${user.id} (${auth.role}) has updated their password successfully.`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                }, prisma.log);
                return { user };
            });
            await this.mailService.accountPasswordUpdateEmail(user, {
                role: auth.role,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Password updated successfully',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async fetchBanks() {
        const banks = await this.paystackService.getBanks();
        return {
            statusCode: common_1.HttpStatus.OK,
            data: banks,
        };
    }
    async resolveAccountNumber(resolveAccountDto) {
        const { account_number, bank_code } = resolveAccountDto;
        const bank = await this.paystackService.resolveAccountNumber(account_number, bank_code);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: bank,
        };
    }
    async getFirstSignupStatus(userId) {
        const user = await this.userRepository.findOne({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return {
            is_first_signup: user.is_first_signup,
        };
    }
    async deleteAccount(auth) {
        const user = await this.userRepository.findOne({ id: auth.sub });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        await this.userRepository.update({ id: user.id }, { deleted_at: new Date() });
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.DELETE,
            entity: 'User',
            entity_id: user.id,
            metadata: `User with email ${user.email} soft-deleted their account.`,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Account deleted successfully.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        mail_service_1.MailService,
        config_1.ConfigService,
        jwt_1.JwtService,
        rbac_service_1.RoleService,
        cart_service_1.CartService,
        common_1.Logger,
        paystack_provider_1.PaystackService,
        google_provider_1.GoogleSSOService])
], AuthService);
//# sourceMappingURL=auth.service.js.map