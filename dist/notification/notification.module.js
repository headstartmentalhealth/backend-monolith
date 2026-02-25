"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const mail_module_1 = require("./mail/mail.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_1 = require("@bull-board/nestjs");
const express_1 = require("@bull-board/express");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const track_module_1 = require("./track/track.module");
const token_module_1 = require("./token/token.module");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRoot({
                connection: {
                    url: 'redis://redis_service:6380',
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                },
            }),
            nestjs_1.BullBoardModule.forRoot({
                route: '/queues',
                adapter: express_1.ExpressAdapter,
            }),
            mail_module_1.MailModule,
            dispatch_module_1.NotificationDispatchModule,
            whatsapp_module_1.WhatsappModule,
            track_module_1.NotificationTrackModule,
            token_module_1.NotificationTokenModule,
        ],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map