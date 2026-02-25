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
exports.NotificationTrackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const generic_dto_1 = require("../../generic/generic.dto");
const generic_service_1 = require("../../generic/generic.service");
const generic_utils_1 = require("../../generic/generic.utils");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const log_service_1 = require("../../log/log.service");
let NotificationTrackService = class NotificationTrackService {
    constructor(prisma, genericService, logService) {
        this.prisma = prisma;
        this.genericService = genericService;
        this.logService = logService;
        this.model = 'Notification';
        this.select = {
            id: true,
            title: true,
            message: true,
            type: true,
            read: true,
            icon_url: true,
            status: true,
            is_scheduled: true,
            business_id: true,
            created_at: true,
            business: {
                select: {
                    id: true,
                    business_name: true,
                    user: { select: { id: true, name: true } },
                },
            },
        };
        this.notificationRepository = new prisma_base_repository_1.PrismaBaseRepository('notification', prisma);
    }
    async fetchInstantNotifications(payload, param, filterDto) {
        const auth = payload.user;
        const { business_id } = param;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id,
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        let filters = {
            is_scheduled: false,
            status: filterDto.status,
            business_id,
            ...(filterDto.q && {
                OR: [
                    {
                        id: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            ...(filterDto.type && { type: filterDto.type }),
            tz: payload.timezone,
        };
        let select = {
            ...this.select,
            message: true,
            recipients: true,
            schedule_info: {
                include: {
                    recipients: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            },
            owner: { select: { id: true, name: true, email: true } },
        };
        const unread_filters = {
            ...filters,
            read: false,
        };
        const [notifications, total, unread] = await Promise.all([
            this.notificationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.notificationRepository.count(filters),
            this.notificationRepository.count(unread_filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: notifications,
            count: total,
            unread_count: unread,
        };
    }
    async fetchScheduledNotifications(payload, param, filterDto) {
        const auth = payload.user;
        const { business_id } = param;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id,
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        let filters = {
            is_scheduled: true,
            status: filterDto.status,
            business_id,
            ...pagination_filters.filters,
            ...(filterDto.type && { type: filterDto.type }),
            ...(filterDto.schedule_status && {
                schedule_info: { status: filterDto.schedule_status },
            }),
            tz: payload.timezone,
        };
        let select = {
            ...this.select,
            recipients: true,
            schedule_info: {
                include: {
                    recipients: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            },
        };
        const [notifications, total] = await Promise.all([
            this.notificationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.notificationRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: notifications,
            count: total,
        };
    }
    async fetchSingleNotification(payload, param) {
        const { id } = param;
        const auth = payload.user;
        const select = {
            ...this.select,
            message: true,
            recipients: true,
            schedule_info: {
                include: {
                    recipients: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            },
        };
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const filters = {
            id,
        };
        const notificationDetails = await this.notificationRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: notificationDetails,
        };
    }
    async fetchNotificationForChart(payload, param, queryDto) {
        const auth = payload.user;
        const { chart_type } = param;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        let scheduled_notifications = {};
        switch (chart_type) {
            case generic_dto_1.ChartType.BAR_CHART:
                scheduled_notifications =
                    await this.fetchScheduledNotificationsForBarChart(payload['Business-Id'], pagination_filters);
                break;
            case generic_dto_1.ChartType.PIE_CHART:
                scheduled_notifications =
                    await this.fetchScheduledNotificationsForPieChart(payload['Business-Id'], pagination_filters);
                break;
            default:
                break;
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: scheduled_notifications,
        };
    }
    async fetchScheduledNotificationsForBarChart(business_id, pagination_filters) {
        const data = await this.prisma.scheduledNotification.groupBy({
            by: ['status'],
            _count: { id: true },
            where: {
                ...pagination_filters.filters,
                notification: {
                    business_id: business_id,
                },
            },
        });
        return data.map((item) => ({ status: item.status, count: item._count.id }));
    }
    async fetchScheduledNotificationsForPieChart(business_id, pagination_filters) {
        const data = await this.prisma.scheduledNotification.groupBy({
            by: ['status'],
            _count: { id: true },
            where: {
                ...pagination_filters.filters,
                notification: {
                    business_id: business_id,
                },
            },
        });
        return data.map((item) => ({ label: item.status, value: item._count.id }));
    }
    async fetchAllInstantNotifications(payload, filterDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        let filters = {
            is_scheduled: false,
            status: filterDto.status,
            ...(filterDto.q && {
                OR: [
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    { id: { contains: filterDto.q, mode: 'insensitive' } },
                    {
                        business_id: {
                            contains: filterDto.q,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
            ...pagination_filters.filters,
            ...(filterDto.type && { type: filterDto.type }),
            tz: payload.timezone,
        };
        let select = {
            ...this.select,
            recipients: true,
            schedule_info: {
                include: {
                    recipients: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            },
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: { select: { role_id: true } },
                    profile: true,
                },
            },
        };
        const unread_filters = {
            ...filters,
            read: false,
        };
        const [notifications, total, unread] = await Promise.all([
            this.notificationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.notificationRepository.count(filters),
            this.notificationRepository.count(unread_filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: notifications,
            count: total,
            unread_count: unread,
        };
    }
    async fetchAllScheduledNotifications(payload, filterDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        let filters = {
            is_scheduled: true,
            status: filterDto.status,
            ...(filterDto.q && {
                OR: [
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    { id: { contains: filterDto.q, mode: 'insensitive' } },
                    {
                        business_id: {
                            contains: filterDto.q,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
            ...pagination_filters.filters,
            ...(filterDto.type && { type: filterDto.type }),
            ...(filterDto.schedule_status && {
                schedule_info: { status: filterDto.schedule_status },
            }),
            tz: payload.timezone,
        };
        let select = {
            ...this.select,
            schedule_info: true,
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: { select: { role_id: true } },
                    profile: true,
                },
            },
        };
        const [notifications, total] = await Promise.all([
            this.notificationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.notificationRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: notifications,
            count: total,
        };
    }
    async deleteNotification(payload, param) {
        const auth = payload.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
            const notification = await prisma.notification.findUnique({
                where: { id },
                select: { id: true, business_id: true },
            });
            if (!notification) {
                throw new common_1.NotFoundException('Notification not found');
            }
            await prisma.notification.update({
                where: { id: notification.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.CUSTOM_EMAIL_NOTIFICATION,
                entity: this.model,
                entity_id: notification.id,
                metadata: `User with ID ${auth.sub} from Business Id ${notification.business_id} just deleted a product payment.`,
                ip_address: (0, generic_utils_1.getIpAddress)(payload),
                user_agent: (0, generic_utils_1.getUserAgent)(payload),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Notification deleted successfully',
            };
        });
    }
    async markNotificationAsRead(notificationId) {
        await this.notificationRepository.update({ id: notificationId }, { read: true });
        return {
            statusCode: 200,
            message: 'Notification marked as read.',
        };
    }
    async markAllNotificationsAsRead(req) {
        await this.notificationRepository.updateMany({ business_id: req['Business-Id'] }, { read: true });
        return {
            statusCode: 200,
            message: 'All notifications marked as read.',
        };
    }
};
exports.NotificationTrackService = NotificationTrackService;
exports.NotificationTrackService = NotificationTrackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        generic_service_1.GenericService,
        log_service_1.LogService])
], NotificationTrackService);
//# sourceMappingURL=track.service.js.map