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
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const cart_service_1 = require("./cart.service");
const cart_dto_1 = require("./cart.dto");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const generic_data_1 = require("../generic/generic.data");
const generic_dto_1 = require("../generic/generic.dto");
let CartController = class CartController {
    constructor(cartService) {
        this.cartService = cartService;
    }
    async addToCart(request, addToCartDto) {
        return this.cartService.add(request, addToCartDto);
    }
    async fetch(request, currencyDto) {
        return this.cartService.fetch(request, currencyDto);
    }
    async update(request, param, updateCartItemDto) {
        return this.cartService.update(request, param, updateCartItemDto);
    }
    async deleteCartItem(request, param) {
        return this.cartService.delete(request, param);
    }
    async fetchAll(request, filterDto) {
        return this.cartService.fetchAll(request, filterDto);
    }
    async addMultipleToCart(request, addMultipleToCartDto) {
        return this.cartService.addMultiple(request, addMultipleToCartDto);
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Post)('add'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_dto_1.AddToCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.CurrencyDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "fetch", null);
__decorate([
    (0, common_1.Put)('item/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto,
        cart_dto_1.UpdateCartItemDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('item/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "deleteCartItem", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_dto_1.FilterCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "fetchAll", null);
__decorate([
    (0, common_1.Post)('add-multiple'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_dto_1.AddMultipleToCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addMultipleToCart", null);
exports.CartController = CartController = __decorate([
    (0, common_1.Controller)('v1/cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], CartController);
//# sourceMappingURL=cart.controller.js.map