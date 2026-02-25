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
exports.SubscriptionPlanRoleController = void 0;
const common_1 = require("@nestjs/common");
const role_service_1 = require("./role.service");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const role_dto_1 = require("./role.dto");
const generic_dto_1 = require("../../generic/generic.dto");
let SubscriptionPlanRoleController = class SubscriptionPlanRoleController {
    constructor(subscriptionPlanRoleService) {
        this.subscriptionPlanRoleService = subscriptionPlanRoleService;
    }
    create(request, createSubcriptionPlanRoleDto) {
        return this.subscriptionPlanRoleService.create(request, createSubcriptionPlanRoleDto);
    }
    fetch(request, param, queryDto) {
        return this.subscriptionPlanRoleService.fetch(request, param, queryDto);
    }
    update(request, param, updateSubscriptionPlanRoleDto) {
        return this.subscriptionPlanRoleService.update(request, param, updateSubscriptionPlanRoleDto);
    }
    delete(request, param) {
        return this.subscriptionPlanRoleService.delete(request, param);
    }
};
exports.SubscriptionPlanRoleController = SubscriptionPlanRoleController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, role_dto_1.CreateSubscriptionPlanRoleDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanRoleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':subscription_plan_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanRoleController.prototype, "fetch", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, role_dto_1.UpdateSubscriptionPlanRoleDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanRoleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanRoleController.prototype, "delete", null);
exports.SubscriptionPlanRoleController = SubscriptionPlanRoleController = __decorate([
    (0, common_1.Controller)('v1/subscription-plan-role'),
    __metadata("design:paramtypes", [role_service_1.SubscriptionPlanRoleService])
], SubscriptionPlanRoleController);
//# sourceMappingURL=role.controller.js.map