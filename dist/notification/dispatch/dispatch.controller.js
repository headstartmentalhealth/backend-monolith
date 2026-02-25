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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatchController = void 0;
const common_1 = require("@nestjs/common");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const dispatch_service_1 = require("./dispatch.service");
const dispatch_dto_1 = require("./dispatch.dto");
let NotificationDispatchController = class NotificationDispatchController {
    constructor(notificationDispatchService) {
        this.notificationDispatchService = notificationDispatchService;
    }
    async createNotification(request, createNotificationDispatchDto) {
        return this.notificationDispatchService.dispatchNotification(request, createNotificationDispatchDto);
    }
    async createConsoleNotification(request, createNotificationDispatchConsoleDto) {
        return this.notificationDispatchService.consoleDispatchNotification(request, createNotificationDispatchConsoleDto);
    }
    async scheduleNotification(request, scheduleNotificationDto) {
        return this.notificationDispatchService.scheduleNotifications(request, scheduleNotificationDto);
    }
    async ownerScheduleNotification(request, scheduleNotificationConsoleDto) {
        return this.notificationDispatchService.consoleScheduleNotifications(request, scheduleNotificationConsoleDto);
    }
    async getNotifications(businessId) {
        return this.notificationDispatchService.getNotifications(businessId);
    }
    async markAsRead(notificationId) {
        return this.notificationDispatchService.markAsRead(notificationId);
    }
    async filterUnread(businessId) {
        return this.notificationDispatchService.filterUnread(businessId);
    }
};
exports.NotificationDispatchController = NotificationDispatchController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dispatch_dto_1.CreateNotificationDispatchDto]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "createNotification", null);
__decorate([
    (0, common_1.Post)('trigger'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dispatch_dto_1.CreateNotificationDispatchConsoleDto]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "createConsoleNotification", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dispatch_dto_1.ScheduleNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "scheduleNotification", null);
__decorate([
    (0, common_1.Post)('initiate-schedule'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dispatch_dto_1.ScheduleNotificationConsoleDto]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "ownerScheduleNotification", null);
__decorate([
    (0, common_1.Get)(':businessId'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)(':notificationId/read'),
    __param(0, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Get)(':businessId/unread'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationDispatchController.prototype, "filterUnread", null);
exports.NotificationDispatchController = NotificationDispatchController = __decorate([
    (0, common_1.Controller)('v1/notification-dispatch'),
    __metadata("design:paramtypes", [dispatch_service_1.NotificationDispatchService])
], NotificationDispatchController);
//# sourceMappingURL=dispatch.controller.js.map