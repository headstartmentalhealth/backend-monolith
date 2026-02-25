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
exports.UpdateSubscriptionPlanPriceDto = exports.CreateSubscriptionPlanPriceDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreateSubscriptionPlanPriceDto {
}
exports.CreateSubscriptionPlanPriceDto = CreateSubscriptionPlanPriceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanPriceDto.prototype, "subscription_plan_id", void 0);
__decorate([
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSubscriptionPlanPriceDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionPeriod),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanPriceDto.prototype, "period", void 0);
class UpdateSubscriptionPlanPriceDto extends (0, mapped_types_1.PartialType)(CreateSubscriptionPlanPriceDto) {
}
exports.UpdateSubscriptionPlanPriceDto = UpdateSubscriptionPlanPriceDto;
//# sourceMappingURL=price.dto.js.map