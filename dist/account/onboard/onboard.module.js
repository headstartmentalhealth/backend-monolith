"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardModule = void 0;
const common_1 = require("@nestjs/common");
const onboard_service_1 = require("./onboard.service");
const onboard_controller_1 = require("./onboard.controller");
const log_service_1 = require("../../log/log.service");
const paystack_provider_1 = require("../../generic/providers/paystack/paystack.provider");
const mail_service_1 = require("../../notification/mail/mail.service");
const upload_module_1 = require("../../multimedia/upload/upload.module");
const cart_service_1 = require("../../cart/cart.service");
const dispatch_module_1 = require("../../notification/dispatch/dispatch.module");
let OnboardModule = class OnboardModule {
};
exports.OnboardModule = OnboardModule;
exports.OnboardModule = OnboardModule = __decorate([
    (0, common_1.Module)({
        imports: [upload_module_1.UploadModule, dispatch_module_1.NotificationDispatchModule],
        controllers: [onboard_controller_1.OnboardController],
        providers: [
            onboard_service_1.OnboardService,
            log_service_1.LogService,
            paystack_provider_1.PaystackService,
            mail_service_1.MailService,
            cart_service_1.CartService,
            common_1.Logger,
        ],
        exports: [onboard_service_1.OnboardService],
    })
], OnboardModule);
//# sourceMappingURL=onboard.module.js.map