"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatchModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_service_1 = require("./dispatch.service");
const dispatch_controller_1 = require("./dispatch.controller");
const mail_service_1 = require("../mail/mail.service");
const bull_1 = require("@nestjs/bull");
const dispatch_processor_1 = require("./dispatch.processor");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const token_service_1 = require("../token/token.service");
let NotificationDispatchModule = class NotificationDispatchModule {
};
exports.NotificationDispatchModule = NotificationDispatchModule;
exports.NotificationDispatchModule = NotificationDispatchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({
                name: 'notificationQueue',
            }),
        ],
        controllers: [dispatch_controller_1.NotificationDispatchController],
        providers: [
            dispatch_service_1.NotificationDispatchService,
            mail_service_1.MailService,
            dispatch_processor_1.NotificationProcessor,
            whatsapp_service_1.WhatsappService,
            token_service_1.NotificationTokenService,
        ],
        exports: [dispatch_service_1.NotificationDispatchService],
    })
], NotificationDispatchModule);
//# sourceMappingURL=dispatch.module.js.map