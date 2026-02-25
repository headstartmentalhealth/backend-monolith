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
exports.NotificationTrackController = void 0;
const common_1 = require("@nestjs/common");
const track_service_1 = require("./track.service");
const track_dto_1 = require("./track.dto");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const generic_dto_1 = require("../../generic/generic.dto");
const business_guard_1 = require("../../generic/guards/business.guard");
let NotificationTrackController = class NotificationTrackController {
    constructor(notificationTrackService) {
        this.notificationTrackService = notificationTrackService;
    }
    async getInstantNotifications(request, queryDto, param) {
        return await this.notificationTrackService.fetchInstantNotifications(request, param, queryDto);
    }
    async getScheduledNotifications(request, queryDto, param) {
        return await this.notificationTrackService.fetchScheduledNotifications(request, param, queryDto);
    }
    async getSingleNotification(request, param) {
        return await this.notificationTrackService.fetchSingleNotification(request, param);
    }
    async getNotificationsForChart(request, param, queryDto) {
        return await this.notificationTrackService.fetchNotificationForChart(request, param, queryDto);
    }
    async fetchAllInstantNotifications(request, queryDto) {
        return await this.notificationTrackService.fetchAllInstantNotifications(request, queryDto);
    }
    async fetchAllScheduledNotifications(request, queryDto) {
        return await this.notificationTrackService.fetchAllScheduledNotifications(request, queryDto);
    }
    async markAllNotificationsAsRead(req) {
        return await this.notificationTrackService.markAllNotificationsAsRead(req);
    }
    async deleteNotification(request, param) {
        return await this.notificationTrackService.deleteNotification(request, param);
    }
    async markNotificationsAsRead(id) {
        return await this.notificationTrackService.markNotificationAsRead(id);
    }
};
exports.NotificationTrackController = NotificationTrackController;
__decorate([
    (0, common_1.Get)('instant/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, track_dto_1.FilterNotificationsDto,
        generic_dto_1.BusinessDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "getInstantNotifications", null);
__decorate([
    (0, common_1.Get)('scheduled/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, track_dto_1.FilterScheduledDto,
        generic_dto_1.BusinessDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "getScheduledNotifications", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Get)('single/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDtoAlias]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "getSingleNotification", null);
__decorate([
    (0, common_1.Get)('statistics/:chart_type'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.ChartDto,
        generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "getNotificationsForChart", null);
__decorate([
    (0, common_1.Get)('fetch-instant'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, track_dto_1.FilterNotificationsDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "fetchAllInstantNotifications", null);
__decorate([
    (0, common_1.Get)('fetch-scheduled'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, track_dto_1.FilterScheduledDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "fetchAllScheduledNotifications", null);
__decorate([
    (0, common_1.Patch)('mark-all-read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "markAllNotificationsAsRead", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Patch)('mark-read/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationTrackController.prototype, "markNotificationsAsRead", null);
exports.NotificationTrackController = NotificationTrackController = __decorate([
    (0, common_1.Controller)('v1/notification-track'),
    __metadata("design:paramtypes", [track_service_1.NotificationTrackService])
], NotificationTrackController);
//# sourceMappingURL=track.controller.js.map