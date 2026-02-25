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
exports.FilterSubscriptionPlanDto = exports.FilterPlanDto = exports.UpdateSubscriptionPlanDto2 = exports.UpdateSubscriptionPlanRoleDto = exports.UpdateSubscriptionPlanPriceDto = exports.CreateSubscriptionPlanDto2 = exports.CreateSubscriptionPlanRoleDto = exports.CreateSubscriptionPlanPriceDto = exports.FilterBusinessPlansDto = exports.FilterPlansDto = exports.UpdateSubscriptionPlanDto = exports.CreateSubscriptionPlanDto = void 0;
const generic_dto_1 = require("../../generic/generic.dto");
const crud_dto_1 = require("../../product/course/crud/crud.dto");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateSubscriptionPlanDto {
}
exports.CreateSubscriptionPlanDto = CreateSubscriptionPlanDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ProductStatus),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "status", void 0);
class UpdateSubscriptionPlanDto {
}
exports.UpdateSubscriptionPlanDto = UpdateSubscriptionPlanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "cover_image", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ProductStatus),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "status", void 0);
class FilterPlansDto {
}
exports.FilterPlansDto = FilterPlansDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SubscriptionPeriod, {
        message: `Period must be one of: ${Object.keys(client_1.SubscriptionPeriod).join(', ')}`,
    }),
    __metadata("design:type", String)
], FilterPlansDto.prototype, "period", void 0);
class FilterBusinessPlansDto extends generic_dto_1.QueryDto {
}
exports.FilterBusinessPlansDto = FilterBusinessPlansDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterBusinessPlansDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterBusinessPlansDto.prototype, "business_id", void 0);
class CreateSubscriptionPlanPriceDto {
}
exports.CreateSubscriptionPlanPriceDto = CreateSubscriptionPlanPriceDto;
__decorate([
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", Number)
], CreateSubscriptionPlanPriceDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanPriceDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionPeriod),
    __metadata("design:type", String)
], CreateSubscriptionPlanPriceDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => crud_dto_1.OtherCurrencyDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateSubscriptionPlanPriceDto.prototype, "other_currencies", void 0);
class CreateSubscriptionPlanRoleDto {
}
exports.CreateSubscriptionPlanRoleDto = CreateSubscriptionPlanRoleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanRoleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanRoleDto.prototype, "role_id", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionPlanRoleDto.prototype, "selected", void 0);
class CreateSubscriptionPlanDto2 {
}
exports.CreateSubscriptionPlanDto2 = CreateSubscriptionPlanDto2;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "creator_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "cover_image", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ProductStatus),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto2.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSubscriptionPlanPriceDto),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateSubscriptionPlanDto2.prototype, "subscription_plan_prices", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSubscriptionPlanRoleDto),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateSubscriptionPlanDto2.prototype, "subscription_plan_roles", void 0);
class UpdateSubscriptionPlanPriceDto {
}
exports.UpdateSubscriptionPlanPriceDto = UpdateSubscriptionPlanPriceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanPriceDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", Number)
], UpdateSubscriptionPlanPriceDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanPriceDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionPeriod),
    __metadata("design:type", String)
], UpdateSubscriptionPlanPriceDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => crud_dto_1.OtherCurrencyDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSubscriptionPlanPriceDto.prototype, "other_currencies", void 0);
class UpdateSubscriptionPlanRoleDto {
}
exports.UpdateSubscriptionPlanRoleDto = UpdateSubscriptionPlanRoleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanRoleDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanRoleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanRoleDto.prototype, "role_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSubscriptionPlanRoleDto.prototype, "selected", void 0);
class UpdateSubscriptionPlanDto2 {
}
exports.UpdateSubscriptionPlanDto2 = UpdateSubscriptionPlanDto2;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "cover_image", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ProductStatus),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto2.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateSubscriptionPlanPriceDto),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSubscriptionPlanDto2.prototype, "subscription_plan_prices", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateSubscriptionPlanRoleDto),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSubscriptionPlanDto2.prototype, "subscription_plan_roles", void 0);
class FilterPlanDto extends generic_dto_1.QueryDto {
}
exports.FilterPlanDto = FilterPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterPlanDto.prototype, "q", void 0);
class FilterSubscriptionPlanDto extends generic_dto_1.QueryDto {
}
exports.FilterSubscriptionPlanDto = FilterSubscriptionPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterSubscriptionPlanDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterSubscriptionPlanDto.prototype, "id", void 0);
//# sourceMappingURL=plan.dto.js.map