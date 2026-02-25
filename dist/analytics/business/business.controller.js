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
exports.BusinessAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const business_service_1 = require("./business.service");
const business_dto_1 = require("./business.dto");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const business_guard_1 = require("../../generic/guards/business.guard");
const generic_dto_1 = require("../../generic/generic.dto");
let BusinessAnalyticsController = class BusinessAnalyticsController {
    constructor(businessAnalyticsService) {
        this.businessAnalyticsService = businessAnalyticsService;
    }
    async getBusinessAnalytics(auth, query) {
        return this.businessAnalyticsService.getBusinessAnalytics(auth, query);
    }
    async getProductRevenueBreakdown(auth) {
        return this.businessAnalyticsService.getProductRevenueBreakdown(auth);
    }
    async getMonthlyProductRevenueBreakdown(auth, query) {
        return this.businessAnalyticsService.getMonthlyProductRevenueBreakdown(auth, query.year);
    }
};
exports.BusinessAnalyticsController = BusinessAnalyticsController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.CurrencyDto]),
    __metadata("design:returntype", Promise)
], BusinessAnalyticsController.prototype, "getBusinessAnalytics", null);
__decorate([
    (0, common_1.Get)('product-revenue'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessAnalyticsController.prototype, "getProductRevenueBreakdown", null);
__decorate([
    (0, common_1.Get)('product-revenue-monthly'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, business_dto_1.ProductRevenueMonthlyDto]),
    __metadata("design:returntype", Promise)
], BusinessAnalyticsController.prototype, "getMonthlyProductRevenueBreakdown", null);
exports.BusinessAnalyticsController = BusinessAnalyticsController = __decorate([
    (0, common_1.Controller)('v1/business-analytics'),
    __metadata("design:paramtypes", [business_service_1.BusinessAnalyticsService])
], BusinessAnalyticsController);
//# sourceMappingURL=business.controller.js.map