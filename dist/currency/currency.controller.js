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
exports.CurrencyController = void 0;
const common_1 = require("@nestjs/common");
const currency_service_1 = require("./currency.service");
const auth_decorator_1 = require("../account/auth/decorators/auth.decorator");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const generic_data_1 = require("../generic/generic.data");
const business_guard_1 = require("../generic/guards/business.guard");
const generic_payload_1 = require("../generic/generic.payload");
const currency_dto_1 = require("./currency.dto");
const generic_dto_1 = require("../generic/generic.dto");
let CurrencyController = class CurrencyController {
    constructor(currencyService) {
        this.currencyService = currencyService;
    }
    async getAvailableCurrencies(req) {
        return this.currencyService.getAvailableCurrencies(req);
    }
    async toggleBusinessAccountCurrency(req, toggleCurrencyDto) {
        return this.currencyService.toggleBusinessAccountCurrency(req, toggleCurrencyDto);
    }
    async toggleBusinessProductEnabledCurrency(req, toggleCurrencyDto) {
        return this.currencyService.toggleBusinessProductEnabledCurrency(req, toggleCurrencyDto);
    }
    async getBusinessAccountCurrencies(businessDto) {
        return this.currencyService.getBusinessAccountCurrencies(businessDto);
    }
    async fetchCurrencyRatesAndAllowedCurrencies() {
        return this.currencyService.fetchCurrencyRatesAndAllowedCurrencies();
    }
};
exports.CurrencyController = CurrencyController;
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Get)('business-currencies'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "getAvailableCurrencies", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Patch)('toggle-business-currency'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        currency_dto_1.ToggleCurrencyDto]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "toggleBusinessAccountCurrency", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Patch)('toggle-product-currency'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        currency_dto_1.ToggleCurrencyDto]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "toggleBusinessProductEnabledCurrency", null);
__decorate([
    (0, common_1.Get)('fetch-business-currencies/:business_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_dto_1.BusinessDto]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "getBusinessAccountCurrencies", null);
__decorate([
    (0, common_1.Get)('fetch-system-currencies'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "fetchCurrencyRatesAndAllowedCurrencies", null);
exports.CurrencyController = CurrencyController = __decorate([
    (0, common_1.Controller)('v1/currency'),
    __metadata("design:paramtypes", [currency_service_1.CurrencyService])
], CurrencyController);
//# sourceMappingURL=currency.controller.js.map