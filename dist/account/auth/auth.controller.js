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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./auth.dto");
const generic_payload_1 = require("../../generic/generic.payload");
const auth_decorator_1 = require("./decorators/auth.decorator");
const generic_dto_1 = require("../../generic/generic.dto");
const sso_dto_1 = require("./sso.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerUserDto, request) {
        return await this.authService.register(registerUserDto, request);
    }
    async registerEmail(resendEmailDto, request) {
        return await this.authService.resendEmailVerification(resendEmailDto, request);
    }
    async verifyEmail(verifyEmailDto, request) {
        return await this.authService.verifyEmail(verifyEmailDto, request);
    }
    async requestOtp(loginDto) {
        return this.authService.requestOtp(loginDto);
    }
    async verifyOtp(verifyOtpDto, request) {
        return this.authService.verifyOtp(verifyOtpDto, request);
    }
    async signin(loginDto, request) {
        return this.authService.signin(loginDto, request);
    }
    async logout(req) {
        return this.authService.logout(req.user);
    }
    async requestUserOtp(loginDto) {
        return this.authService.requestUserOtp(loginDto);
    }
    async verifyUserOtp(verifyOtpDto, request) {
        return this.authService.verifyUserOtp(verifyOtpDto, request);
    }
    sso(request, ssoDto) {
        return this.authService.sso(request, ssoDto);
    }
    async requestPasswordRequest(requestPasswordResetDto) {
        return this.authService.requestPasswordReset(requestPasswordResetDto);
    }
    async verifyPasswordToken(tokenDto) {
        return this.authService.verifyPasswordResetToken(tokenDto);
    }
    async resetPassword(resetPasswordDto, request) {
        return this.authService.resetPassword(resetPasswordDto, request);
    }
    async viewProfile(req) {
        return this.authService.getProfile(req.user);
    }
    async updateName(req, updateNameDto) {
        return this.authService.updateName(req.user, updateNameDto);
    }
    async requestEmailUpdate(req, emailDto) {
        return this.authService.requestEmailUpdateOtp(req.user, emailDto);
    }
    async verifyAndUpdateEmail(req, verifyOtpDto) {
        return this.authService.verifyAndUpdateEmail(req.user, verifyOtpDto);
    }
    async savePersonalInfo(req, savePersonalInfoDto) {
        return this.authService.savePersonalInfo(req.user, savePersonalInfoDto);
    }
    async registerCustomer(registerCustomerDto, request) {
        return await this.authService.registerCustomer(registerCustomerDto, request);
    }
    async verifyEmailAndSavePassword(request, verifyEmailAndSavePasswordDto) {
        return await this.authService.verifyEmailAndSavePassword(request, verifyEmailAndSavePasswordDto);
    }
    async verifyEmailToken(request, tokenDto) {
        return await this.authService.verifyEmailToken(request, tokenDto);
    }
    async requestNewAccountEmailToken(request, emailDto) {
        return await this.authService.requestNewAccountEmailToken(request, emailDto);
    }
    async saveProfileInfo(req, savePersonalInfoDto) {
        return this.authService.saveProfileInfo(req.user, savePersonalInfoDto);
    }
    async updatePassword(req, updatePasswordDto) {
        return this.authService.updatePassword(req, updatePasswordDto);
    }
    async getFirstSignupStatus(req) {
        return {
            statusCode: common_1.HttpStatus.OK,
            data: await this.authService.getFirstSignupStatus(req.user.sub),
        };
    }
    async fetchBanks(req) {
        return this.authService.fetchBanks();
    }
    async resolveAccount(dto) {
        return this.authService.resolveAccountNumber(dto);
    }
    async deleteAccount(req) {
        return this.authService.deleteAccount(req.user);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('resend-email'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResendEmailDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerEmail", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyEmailDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('request-otp'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('signin'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signin", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('request-account-otp'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestUserOtp", null);
__decorate([
    (0, common_1.Post)('verify-account-otp'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyUserOtp", null);
__decorate([
    (0, common_1.Post)('sso'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sso_dto_1.SSODto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sso", null);
__decorate([
    (0, common_1.Post)('request-password-reset'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestPasswordResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestPasswordRequest", null);
__decorate([
    (0, common_1.Post)('verify-password-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.TokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyPasswordToken", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('view-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "viewProfile", null);
__decorate([
    (0, common_1.Patch)('update-name'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        auth_dto_1.UpdateNameDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateName", null);
__decorate([
    (0, common_1.Post)('update-email-request'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        generic_dto_1.EmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestEmailUpdate", null);
__decorate([
    (0, common_1.Patch)('update-email'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        auth_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyAndUpdateEmail", null);
__decorate([
    (0, common_1.Post)('save-personal-info'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        auth_dto_1.SavePersonalInfoDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "savePersonalInfo", null);
__decorate([
    (0, common_1.Post)('register-customer'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerCustomer", null);
__decorate([
    (0, common_1.Post)('verify-email-save-password'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.VerifyEmailAndSavePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmailAndSavePassword", null);
__decorate([
    (0, common_1.Post)('verify-email-token'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.TokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmailToken", null);
__decorate([
    (0, common_1.Post)('request-password-creation'),
    (0, auth_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.EmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestNewAccountEmailToken", null);
__decorate([
    (0, common_1.Post)('save-profile-info'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        auth_dto_1.SavePersonalInfoDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "saveProfileInfo", null);
__decorate([
    (0, common_1.Post)('update-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Get)('first-signup-status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getFirstSignupStatus", null);
__decorate([
    (0, common_1.Get)('fetch-banks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "fetchBanks", null);
__decorate([
    (0, common_1.Post)('resolve-account'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResolveAccountDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resolveAccount", null);
__decorate([
    (0, common_1.Delete)('delete-account'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('v1/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map