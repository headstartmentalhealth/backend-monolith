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
exports.CouponManagementController = void 0;
const common_1 = require("@nestjs/common");
const management_service_1 = require("./management.service");
const generic_data_1 = require("../../generic/generic.data");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const management_dto_1 = require("./management.dto");
const generic_dto_1 = require("../../generic/generic.dto");
const business_guard_1 = require("../../generic/guards/business.guard");
const auth_decorator_1 = require("../../account/auth/decorators/auth.decorator");
let CouponManagementController = class CouponManagementController {
    constructor(couponManagementService) {
        this.couponManagementService = couponManagementService;
    }
    create(request, createCouponDto) {
        return this.couponManagementService.create(request, createCouponDto);
    }
    fetch(request, param, filterDto) {
        return this.couponManagementService.fetch(request, param, filterDto);
    }
    fetchDetails(request, param) {
        return this.couponManagementService.fetchSingle(request, param);
    }
    update(request, param, updateCouponDto) {
        return this.couponManagementService.update(request, param, updateCouponDto);
    }
    delete(request, param) {
        return this.couponManagementService.delete(request, param);
    }
    fetchAll(request, filterDto) {
        return this.couponManagementService.fetchAll(request, filterDto);
    }
    applyCoupon(body) {
        return this.couponManagementService.validateAndApplyCoupon(body.email, body.code, +body.amount);
    }
};
exports.CouponManagementController = CouponManagementController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, management_dto_1.CreateCouponDto]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('fetch/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)('details/:id'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "fetchDetails", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, management_dto_1.UpdateCouponDto]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CouponManagementController.prototype, "fetchAll", null);
__decorate([
    (0, common_1.Post)('apply-coupon'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [management_dto_1.ApplyCouponDto]),
    __metadata("design:returntype", void 0)
], CouponManagementController.prototype, "applyCoupon", null);
exports.CouponManagementController = CouponManagementController = __decorate([
    (0, common_1.Controller)('v1/coupon-management'),
    __metadata("design:paramtypes", [management_service_1.CouponManagementService])
], CouponManagementController);
//# sourceMappingURL=management.controller.js.map