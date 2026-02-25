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
exports.TurnstileService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let TurnstileService = class TurnstileService {
    constructor(configService) {
        this.configService = configService;
    }
    async validateToken(token, remoteip) {
        if (!token) {
            throw new common_1.BadRequestException('Missing Turnstile token');
        }
        try {
            const url = this.configService.get('CLOUDFLARE_TURNSTILE_URL');
            const response = await axios_1.default.post(url, new URLSearchParams({
                secret: this.configService.get('CLOUDFLARE_SECRET_KEY'),
                response: token,
                remoteip: remoteip || '',
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const data = response.data;
            if (!data.success) {
                throw new common_1.BadRequestException('Invalid Turnstile token');
            }
        }
        catch (error) {
            throw new common_1.BadRequestException('Turnstile validation failed');
        }
    }
};
exports.TurnstileService = TurnstileService;
exports.TurnstileService = TurnstileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TurnstileService);
//# sourceMappingURL=turnstile.provider.js.map