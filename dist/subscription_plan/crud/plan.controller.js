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
exports.SubscriptionPlanController = void 0;
const common_1 = require("@nestjs/common");
const plan_service_1 = require("./plan.service");
const plan_dto_1 = require("./plan.dto");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const generic_dto_1 = require("../../generic/generic.dto");
const auth_decorator_1 = require("../../account/auth/decorators/auth.decorator");
const business_guard_1 = require("../../generic/guards/business.guard");
let SubscriptionPlanController = class SubscriptionPlanController {
    constructor(subscriptionPlanService) {
        this.subscriptionPlanService = subscriptionPlanService;
    }
    create(request, createSubPlanDto) {
        return this.subscriptionPlanService.create(request, createSubPlanDto);
    }
    fetch(request, param, queryDto) {
        return this.subscriptionPlanService.fetch(request, param, queryDto);
    }
    findSingle(request, param) {
        return this.subscriptionPlanService.findSingle(param);
    }
    update(request, param, updateSubPlanDto) {
        return this.subscriptionPlanService.update(request, param, updateSubPlanDto);
    }
    delete(request, param) {
        return this.subscriptionPlanService.delete(request, param);
    }
    publicFetch(request, param, queryDto) {
        return this.subscriptionPlanService.publicFetch(request, param, queryDto);
    }
    fetchBusinessPlans(request, filterBusinessPlanDto) {
        return this.subscriptionPlanService.fetchBusinessPlans(request, filterBusinessPlanDto);
    }
    bulkCreate(request, dto) {
        return this.subscriptionPlanService.createSubscriptionPlan(request, dto);
    }
    async bulkUpdate(id, dto, request) {
        return this.subscriptionPlanService.updateSubscriptionPlan(id, dto, request);
    }
    async fetchPublicSubscriptionPlans(request, businessId, filterDto) {
        return this.subscriptionPlanService.fetchPublicSubscriptionPlans(businessId, filterDto);
    }
};
exports.SubscriptionPlanController = SubscriptionPlanController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, plan_dto_1.CreateSubscriptionPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('fetch/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN, generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, plan_dto_1.FilterPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "fetch", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Get)('fetch-single/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN, generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "findSingle", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, plan_dto_1.UpdateSubscriptionPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('view/:business_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "publicFetch", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, plan_dto_1.FilterBusinessPlansDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "fetchBusinessPlans", null);
__decorate([
    (0, common_1.Post)('bulk-create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, plan_dto_1.CreateSubscriptionPlanDto2]),
    __metadata("design:returntype", void 0)
], SubscriptionPlanController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Patch)(':id/bulk-update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, plan_dto_1.UpdateSubscriptionPlanDto2, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "bulkUpdate", null);
__decorate([
    (0, common_1.Get)('public/:business_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('business_id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, plan_dto_1.FilterSubscriptionPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionPlanController.prototype, "fetchPublicSubscriptionPlans", null);
exports.SubscriptionPlanController = SubscriptionPlanController = __decorate([
    (0, common_1.Controller)('v1/subscription-plan'),
    __metadata("design:paramtypes", [plan_service_1.SubscriptionPlanService])
], SubscriptionPlanController);
//# sourceMappingURL=plan.controller.js.map