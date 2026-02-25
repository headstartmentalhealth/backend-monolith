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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMultipleToCartDto = exports.AddMultipleToCartItemDto = exports.FilterCartDto = exports.RemoveCartItemsDto = exports.UpdateCartItemDto = exports.AddToCartDto = void 0;
const generic_dto_1 = require("../generic/generic.dto");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AddToCartDto {
}
exports.AddToCartDto = AddToCartDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddToCartDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ProductType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddToCartDto.prototype, "product_type", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddToCartDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddToCartDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AddToCartDto.prototype, "metadata", void 0);
class UpdateCartItemDto {
}
exports.UpdateCartItemDto = UpdateCartItemDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateCartItemDto.prototype, "quantity", void 0);
class RemoveCartItemsDto {
}
exports.RemoveCartItemsDto = RemoveCartItemsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RemoveCartItemsDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], RemoveCartItemsDto.prototype, "product_ids", void 0);
class FilterCartDto extends generic_dto_1.QueryDto {
}
exports.FilterCartDto = FilterCartDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterCartDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterCartDto.prototype, "business_id", void 0);
class AddMultipleToCartItemDto {
}
exports.AddMultipleToCartItemDto = AddMultipleToCartItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddMultipleToCartItemDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ProductType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddMultipleToCartItemDto.prototype, "product_type", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddMultipleToCartItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => generic_dto_1.MeasurementMetadataDto),
    __metadata("design:type", Array)
], AddMultipleToCartItemDto.prototype, "metadata", void 0);
class AddMultipleToCartDto {
}
exports.AddMultipleToCartDto = AddMultipleToCartDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddMultipleToCartItemDto),
    __metadata("design:type", Array)
], AddMultipleToCartDto.prototype, "items", void 0);
//# sourceMappingURL=cart.dto.js.map