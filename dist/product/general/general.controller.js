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
exports.ProductGeneralController = void 0;
const common_1 = require("@nestjs/common");
const general_service_1 = require("./general.service");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const business_guard_1 = require("../../generic/guards/business.guard");
const crud_dto_1 = require("../ticket/crud/crud.dto");
const auth_decorator_1 = require("../../account/auth/decorators/auth.decorator");
let ProductGeneralController = class ProductGeneralController {
    constructor(productGeneralService) {
        this.productGeneralService = productGeneralService;
    }
    fetch(request, filterProductDto) {
        return this.productGeneralService.fetch(request, filterProductDto);
    }
    fetchAll(request, filterProductDto) {
        return this.productGeneralService.fetchAll(request, filterProductDto);
    }
    fetchOrganizationProducts(businessId, filterProductDto) {
        return this.productGeneralService.fetchOrganizationProducts(businessId, filterProductDto);
    }
    fetchProductByIdPublic(productId, query) {
        return this.productGeneralService.fetchProductByIdPublic(productId, query.currency);
    }
};
exports.ProductGeneralController = ProductGeneralController;
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.FilterProductDto]),
    __metadata("design:returntype", Promise)
], ProductGeneralController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)('fetch'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.FilterProductDto]),
    __metadata("design:returntype", Promise)
], ProductGeneralController.prototype, "fetchAll", null);
__decorate([
    (0, common_1.Get)('organization/:business_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('business_id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, crud_dto_1.FilterProductDto]),
    __metadata("design:returntype", Promise)
], ProductGeneralController.prototype, "fetchOrganizationProducts", null);
__decorate([
    (0, common_1.Get)('public/:product_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('product_id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductGeneralController.prototype, "fetchProductByIdPublic", null);
exports.ProductGeneralController = ProductGeneralController = __decorate([
    (0, common_1.Controller)('v1/product-general'),
    __metadata("design:paramtypes", [general_service_1.ProductGeneralService])
], ProductGeneralController);
//# sourceMappingURL=general.controller.js.map