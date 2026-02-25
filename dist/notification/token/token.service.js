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
exports.NotificationTokenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationTokenService = class NotificationTokenService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addPushNotification(payload, createNotificationTokenDto) {
        const { sub: user_id } = payload.user;
        const existing_token = await this.prisma.notificationToken.findFirst({
            where: {
                user_id: user_id,
            },
        });
        if (existing_token) {
            await this.prisma.notificationToken.update({
                where: { id: existing_token.id },
                data: {
                    token: createNotificationTokenDto.token,
                    device_type: createNotificationTokenDto.device_type,
                    is_active: true,
                },
            });
        }
        else {
            const notification_token = await this.prisma.notificationToken.findFirst({
                where: { token: createNotificationTokenDto.token },
            });
            if (notification_token) {
                await this.prisma.notificationToken.update({
                    where: { id: notification_token.id },
                    data: {
                        token: createNotificationTokenDto.token,
                        device_type: createNotificationTokenDto.device_type,
                        is_active: true,
                        user_id,
                    },
                });
            }
            else {
                await this.prisma.notificationToken.create({
                    data: {
                        token: createNotificationTokenDto.token,
                        device_type: createNotificationTokenDto.device_type,
                        is_active: true,
                        user_id,
                    },
                });
            }
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Notification token saved successfully',
        };
    }
    async reactivateToken(token) {
        return this.prisma.notificationToken.update({
            where: { token },
            data: {
                is_active: true,
                updated_at: new Date(),
            },
        });
    }
    async deactivateToken(request, param) {
        const { id } = param;
        await this.prisma.notificationToken.update({
            where: { id },
            data: { is_active: false },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Notification token deactivated successfully.',
        };
    }
    async findByToken(token) {
        return this.prisma.notificationToken.findUnique({
            where: { token },
        });
    }
    async findManyByUser(payload) {
        const { sub: user_id } = payload.user;
        const tokens = await this.prisma.notificationToken.findMany({
            where: { user_id },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Notification token fetched successfully',
            data: tokens,
        };
    }
    async findOneByUser(user_id) {
        return this.prisma.notificationToken.findFirst({
            where: { user_id },
        });
    }
};
exports.NotificationTokenService = NotificationTokenService;
exports.NotificationTokenService = NotificationTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationTokenService);
//# sourceMappingURL=token.service.js.map