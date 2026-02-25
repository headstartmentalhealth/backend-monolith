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
exports.NotificationTokenController = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./token.service");
const create_notification_token_dto_1 = require("./dto/create-notification-token.dto");
const generic_dto_1 = require("../../generic/generic.dto");
let NotificationTokenController = class NotificationTokenController {
    constructor(notificationTokenService) {
        this.notificationTokenService = notificationTokenService;
    }
    async addPushNotification(request, createNotificationTokenDto) {
        return this.notificationTokenService.addPushNotification(request, createNotificationTokenDto);
    }
    async getUserTokens(request) {
        return this.notificationTokenService.findManyByUser(request);
    }
    async deactivateToken(request, param) {
        return this.notificationTokenService.deactivateToken(request, param);
    }
};
exports.NotificationTokenController = NotificationTokenController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_notification_token_dto_1.CreateNotificationTokenDto]),
    __metadata("design:returntype", Promise)
], NotificationTokenController.prototype, "addPushNotification", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationTokenController.prototype, "getUserTokens", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], NotificationTokenController.prototype, "deactivateToken", null);
exports.NotificationTokenController = NotificationTokenController = __decorate([
    (0, common_1.Controller)('v1/notification-token'),
    __metadata("design:paramtypes", [token_service_1.NotificationTokenService])
], NotificationTokenController);
//# sourceMappingURL=token.controller.js.map