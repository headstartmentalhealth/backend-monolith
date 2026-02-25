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
var NotificationDispatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatchService = void 0;
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const generic_service_1 = require("../../generic/generic.service");
const client_1 = require("@prisma/client");
const mail_service_1 = require("../mail/mail.service");
const bull_1 = require("@nestjs/bull");
const generic_utils_1 = require("../../generic/generic.utils");
const log_service_1 = require("../../log/log.service");
const token_service_1 = require("../token/token.service");
const firebase_provider_1 = require("../provider/firebase/firebase.provider");
let NotificationDispatchService = NotificationDispatchService_1 = class NotificationDispatchService {
    constructor(prisma, genericService, mailService, notificationTokenService, notificationQueue, logService) {
        this.prisma = prisma;
        this.genericService = genericService;
        this.mailService = mailService;
        this.notificationTokenService = notificationTokenService;
        this.notificationQueue = notificationQueue;
        this.logService = logService;
        this.logger = new common_1.Logger(NotificationDispatchService_1.name);
        this.model = 'Notification';
        this.TOPIC = 'public';
    }
    async dispatchNotification(request, createNotificationDispatchDto) {
        const auth = request.user;
        let { business_id, type } = createNotificationDispatchDto;
        return await this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id,
            });
            const data = {
                ...createNotificationDispatchDto,
                recipients: {
                    connect: createNotificationDispatchDto.recipients.map((recipient) => ({ id: recipient })),
                },
                owner_id: auth.sub,
            };
            const notification = await prisma.notification.create({
                data,
                include: { recipients: true, business: true },
            });
            await Promise.all(notification.recipients.map((recipient) => this.notificationQueue.add('sendNotification', {
                notification: (0, generic_utils_1.formatNotificationMessage)({
                    notification,
                    recipient,
                }),
                recipient,
                notification_type: notification.type,
            })));
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: type === client_1.NotificationType.EMAIL
                    ? client_1.Action.CUSTOM_EMAIL_NOTIFICATION
                    : client_1.Action.CUSTOM_WHATSAPP_NOTIFICATION,
                entity: 'Notification',
                entity_id: notification.id,
                metadata: `User with ID ${auth.sub} just dispatched email notifications to ${notification.recipients.length} member(s) of Business ID ${notification.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Notification dispatched successfully.',
            };
        });
    }
    async scheduleNotifications(request, scheduleNotificationDto) {
        const auth = request.user;
        let { business_id, type, scheduled_time, recipients } = scheduleNotificationDto;
        return await this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id,
            });
            const notificationData = {
                title: scheduleNotificationDto.title,
                message: scheduleNotificationDto.message,
                type: scheduleNotificationDto.type,
                is_scheduled: true,
                owner: { connect: { id: auth.sub } },
                business: { connect: { id: business_id } },
                recipients: {
                    connect: [],
                },
            };
            const notification = await prisma.notification.create({
                data: notificationData,
                include: { recipients: true },
            });
            const scheduledNotification = await prisma.scheduledNotification.create({
                data: {
                    notification: { connect: { id: notification.id } },
                    scheduled_time,
                    status: client_1.NotificationStatus.PENDING,
                },
                include: { notification: true },
            });
            await prisma.notificationRecipient.createMany({
                data: recipients.map((recipient) => ({
                    scheduled_notification_id: scheduledNotification.id,
                    user_id: recipient,
                    status: client_1.NotificationStatus.PENDING,
                    received_at: scheduled_time,
                })),
            });
            await this.notificationQueue.add('processScheduledNotification', {
                notificationId: notification.id,
                scheduledNotificationId: scheduledNotification.id,
                type: notification.type,
            }, { delay: new Date(scheduled_time).getTime() - Date.now() });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.CUSTOM_EMAIL_NOTIFICATION,
                entity: 'ScheduledNotification',
                entity_id: scheduledNotification.id,
                metadata: `User with ID ${auth.sub} scheduled email notifications to ${recipients.length} member(s) of Business ID ${business_id} for ${scheduled_time}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Email notifications scheduled successfully.',
            };
        });
    }
    async getNotifications(businessId) {
        return this.prisma.notification.findMany({
            where: { business_id: businessId },
            orderBy: { created_at: 'desc' },
        });
    }
    async markAsRead(notificationId) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { status: true },
        });
    }
    async filterUnread(businessId) {
        return this.prisma.notification.findMany({
            where: { business_id: businessId, status: false },
        });
    }
    async consoleDispatchNotification(request, createNotificationDispatchConsoleDto) {
        const auth = request.user;
        let { type, recipients } = createNotificationDispatchConsoleDto;
        return await this.prisma.$transaction(async (prisma) => {
            const existingUsers = await prisma.user.findMany({
                where: { id: { in: recipients } },
                select: { id: true },
            });
            const existingUserIds = existingUsers.map((u) => u.id);
            const missingUserIds = recipients.filter((id) => !existingUserIds.includes(id));
            if (missingUserIds.length > 0) {
                throw new common_1.BadRequestException(`The following recipient IDs are invalid: ${missingUserIds.join(', ')}`);
            }
            const data = {
                ...createNotificationDispatchConsoleDto,
                recipients: {
                    connect: recipients.map((recipient) => ({ id: recipient })),
                },
                owner_id: auth.sub,
            };
            const notification = await prisma.notification.create({
                data,
                include: { recipients: true },
            });
            await Promise.all(notification.recipients.map((recipient) => this.notificationQueue.add('sendNotification', {
                notification: (0, generic_utils_1.formatNotificationMessage)({
                    notification,
                    recipient,
                }),
                recipient,
                notification_type: notification.type,
            })));
            let metadata = `User with ID ${auth.sub} just dispatched email notifications to ${notification.recipients.length} organization(s)`;
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: type === client_1.NotificationType.EMAIL
                    ? client_1.Action.CUSTOM_EMAIL_NOTIFICATION
                    : client_1.Action.CUSTOM_WHATSAPP_NOTIFICATION,
                entity: 'Notification',
                entity_id: notification.id,
                metadata,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Notification dispatched successfully.',
            };
        });
    }
    async consoleScheduleNotifications(request, scheduleNotificationConsoleDto) {
        const auth = request.user;
        let { type, scheduled_time, recipients } = scheduleNotificationConsoleDto;
        return await this.prisma.$transaction(async (prisma) => {
            const notificationData = {
                title: scheduleNotificationConsoleDto.title,
                message: scheduleNotificationConsoleDto.message,
                type: scheduleNotificationConsoleDto.type,
                is_scheduled: true,
                owner: { connect: { id: auth.sub } },
                recipients: {
                    connect: [],
                },
            };
            const notification = await prisma.notification.create({
                data: notificationData,
                include: { recipients: true },
            });
            const scheduledNotification = await prisma.scheduledNotification.create({
                data: {
                    notification: { connect: { id: notification.id } },
                    scheduled_time,
                    status: client_1.NotificationStatus.PENDING,
                },
                include: { notification: true },
            });
            await prisma.notificationRecipient.createMany({
                data: recipients.map((recipient) => ({
                    scheduled_notification_id: scheduledNotification.id,
                    user_id: recipient,
                    status: client_1.NotificationStatus.PENDING,
                    received_at: scheduled_time,
                })),
            });
            await this.notificationQueue.add('processScheduledNotification', {
                notificationId: notification.id,
                scheduledNotificationId: scheduledNotification.id,
                type: notification.type,
            }, { delay: new Date(scheduled_time).getTime() - Date.now() });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.CUSTOM_EMAIL_NOTIFICATION,
                entity: 'ScheduledNotification',
                entity_id: scheduledNotification.id,
                metadata: `User with ID ${auth.sub} scheduled email notifications to ${recipients.length} organization(s) for ${scheduled_time}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Email notifications scheduled successfully.',
            };
        });
    }
    async sendPush(userId, title, body, link, data) {
        const notificationToken = await this.notificationTokenService.findOneByUser(userId);
        if (notificationToken) {
            const message = {
                notification: { title, body },
                webpush: {
                    headers: {
                        Urgency: 'high',
                    },
                    notification: {
                        requireInteraction: true,
                        sound: 'default',
                        click_action: link,
                    },
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'high_importance_channel',
                        click_action: link || '',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            alert: { title, body },
                        },
                    },
                },
                token: notificationToken?.token,
                data: {
                    details: JSON.stringify(data),
                },
            };
            try {
                const response = await firebase_provider_1.default.messaging().send(message);
                console.log('Successfully sent message:', response);
            }
            catch (error) {
                console.error('Error sending push notification:', error);
            }
        }
    }
    async sendPushToTopic(title, body) {
        await firebase_provider_1.default
            .messaging()
            .send({
            notification: { title, body },
            topic: this.TOPIC,
            android: { priority: 'high' },
        })
            .catch((error) => {
            console.error(error);
        });
    }
};
exports.NotificationDispatchService = NotificationDispatchService;
exports.NotificationDispatchService = NotificationDispatchService = NotificationDispatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)(),
    __param(4, (0, bull_1.InjectQueue)('notificationQueue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        generic_service_1.GenericService,
        mail_service_1.MailService,
        token_service_1.NotificationTokenService, Object, log_service_1.LogService])
], NotificationDispatchService);
//# sourceMappingURL=dispatch.service.js.map