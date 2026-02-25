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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const mail_service_1 = require("../mail/mail.service");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor {
    constructor(mailService, prisma, whatsappService) {
        this.mailService = mailService;
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(NotificationProcessor_1.name);
    }
    async handleNotification(job) {
        try {
            const { notification, recipient, notification_type, } = job.data;
            console.log(job.data);
            this.logger.log(`Sending ${notification_type} notification to user ${recipient.id}: ${notification.title}`);
            if (notification.type === client_1.NotificationType.EMAIL) {
                await this.mailService.customEmail(recipient, notification);
            }
            else if (notification.type === client_1.NotificationType.WHATSAPP) {
                await this.whatsappService.sendBulkMessage(recipient, notification);
            }
            return {};
        }
        catch (error) {
            this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
            throw error;
        }
    }
    async processScheduledNotification(job) {
        try {
            const { scheduledNotificationId } = job.data;
            this.logger.log(`Processing scheduled notification ${scheduledNotificationId}`);
            return this.prisma.$transaction(async (prisma) => {
                const scheduledNotification = await prisma.scheduledNotification.findUnique({
                    where: { id: scheduledNotificationId },
                    include: {
                        notification: { include: { business: true } },
                        recipients: { include: { user: true } },
                    },
                });
                if (!scheduledNotification) {
                    this.logger.error(`Scheduled notification ${scheduledNotificationId} not found`);
                    return;
                }
                await Promise.all(scheduledNotification.recipients.map(async (recipient) => {
                    if (scheduledNotification.notification.type === client_1.NotificationType.EMAIL) {
                        await this.mailService.customEmail(recipient.user, scheduledNotification.notification);
                    }
                    else if (scheduledNotification.notification.type ===
                        client_1.NotificationType.WHATSAPP) {
                        await this.whatsappService.sendBulkMessage(recipient.user, scheduledNotification.notification);
                    }
                    await prisma.notificationRecipient.update({
                        where: { id: recipient.id },
                        data: { status: client_1.NotificationStatus.SENT },
                    });
                }));
                await prisma.scheduledNotification.update({
                    where: { id: scheduledNotificationId },
                    data: { status: client_1.NotificationStatus.DELIVERED },
                });
                this.logger.log(`Scheduled notification ${scheduledNotificationId} processed successfully.`);
            });
        }
        catch (error) {
            this.logger.error(`Failed to process scheduled notification ${job.id}: ${error.message}`);
            throw error;
        }
    }
};
exports.NotificationProcessor = NotificationProcessor;
__decorate([
    (0, bull_1.Process)('sendNotification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "handleNotification", null);
__decorate([
    (0, bull_1.Process)('processScheduledNotification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "processScheduledNotification", null);
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bull_1.Processor)('notificationQueue'),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService])
], NotificationProcessor);
//# sourceMappingURL=dispatch.processor.js.map