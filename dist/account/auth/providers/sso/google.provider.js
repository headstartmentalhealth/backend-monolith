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
exports.GoogleRecaptchaService = exports.GoogleSSOService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_2 = require("axios");
const google_auth_library_1 = require("google-auth-library");
const sso_dto_1 = require("../../sso.dto");
let GoogleSSOService = class GoogleSSOService {
    constructor(configService) {
        this.configService = configService;
        this.GOOGLE_CLIENT_ID = this.configService.get('GOOGLE_CLIENT_ID');
        this.GOOGLE_MOBILE_CLIENT_ID = this.configService.get('GOOGLE_MOBILE_CLIENT_ID');
        this.GOOGLE_CLIENT_SECRET = this.configService.get('GOOGLE_CLIENT_SECRET');
        this.google = new google_auth_library_1.OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    }
    async verify(token, platform) {
        try {
            let clientID = this.GOOGLE_CLIENT_ID;
            let profile;
            if (platform) {
                if (platform === sso_dto_1.Platform.MOBILE) {
                    const { data } = await axios_2.default.get('https://www.googleapis.com/oauth2/v1/userinfo', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    profile = data;
                }
            }
            else {
                const ticket = await this.google.verifyIdToken({
                    idToken: token,
                    audience: clientID,
                });
                profile = ticket.getPayload();
                console.log(1);
            }
            console.log(profile);
            return profile;
        }
        catch (error) {
            console.error(error);
            throw new common_1.BadRequestException('Google SSO validation error:', error);
        }
    }
};
exports.GoogleSSOService = GoogleSSOService;
exports.GoogleSSOService = GoogleSSOService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleSSOService);
let GoogleRecaptchaService = class GoogleRecaptchaService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.google_captcha_secret = this.configService.get('GOOGLE_RECAPTCHA_SECRET_KEY');
        this.captcha = this.configService.get('GOOGLE_RECAPTCHA_SITE_KEY');
        this.url = `https://www.google.com/recaptcha/api/siteverify?secret=${this.google_captcha_secret}`;
    }
    async validate(captcha) {
        try {
            this.url += `&response=${captcha}`;
            const response = await this.httpService.post(this.url).toPromise();
            console.log(response);
            if (!response.data.success) {
                throw new Error('Recaptcha Validation error');
            }
            return true;
        }
        catch (error) {
            console.error(error);
            throw new common_1.BadRequestException(error.message || 'Something went wrong.');
        }
    }
};
exports.GoogleRecaptchaService = GoogleRecaptchaService;
exports.GoogleRecaptchaService = GoogleRecaptchaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], GoogleRecaptchaService);
//# sourceMappingURL=google.provider.js.map