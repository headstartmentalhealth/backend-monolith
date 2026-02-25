"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const log_service_1 = require("../../log/log.service");
const mail_service_1 = require("../../notification/mail/mail.service");
const auth_controller_1 = require("./auth.controller");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const rbac_module_1 = require("../../rbac/rbac.module");
const role_guard_1 = require("./guards/role.guard");
const core_1 = require("@nestjs/core");
const auth_guard_1 = require("./guards/auth.guard");
const google_provider_1 = require("./providers/sso/google.provider");
const cart_service_1 = require("../../cart/cart.service");
const turnstile_provider_1 = require("./providers/cloudflare/turnstile.provider");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [rbac_module_1.RbacModule],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            log_service_1.LogService,
            mail_service_1.MailService,
            cart_service_1.CartService,
            jwt_1.JwtService,
            config_1.ConfigService,
            common_1.Logger,
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: role_guard_1.RolesGuard,
            },
            google_provider_1.GoogleSSOService,
            turnstile_provider_1.TurnstileService,
        ],
        exports: [auth_service_1.AuthService, turnstile_provider_1.TurnstileService, jwt_1.JwtService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map