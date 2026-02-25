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
exports.MeasurementMetadataDto = exports.CurrencyDto = exports.ChartDto = exports.ChartType = exports.UserDto = exports.BusinessDto = exports.TZ = exports.EmailDto = exports.QueryDto = exports.Pagination = exports.UniqueColumnConstraint = exports.IdDtoAlias = exports.TypeDto = exports.IdDto = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class IdDto {
}
exports.IdDto = IdDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], IdDto.prototype, "id", void 0);
class TypeDto {
}
exports.TypeDto = TypeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TypeDto.prototype, "type", void 0);
class IdDtoAlias {
}
exports.IdDtoAlias = IdDtoAlias;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IdDtoAlias.prototype, "id", void 0);
let UniqueColumnConstraint = class UniqueColumnConstraint {
    async validate(value, validationArguments) {
        return true;
    }
};
exports.UniqueColumnConstraint = UniqueColumnConstraint;
exports.UniqueColumnConstraint = UniqueColumnConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true }),
    (0, common_1.Injectable)()
], UniqueColumnConstraint);
class Pagination {
}
exports.Pagination = Pagination;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Pagination.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Pagination.prototype, "page", void 0);
class QueryDto {
}
exports.QueryDto = QueryDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsObject)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Pagination)
], QueryDto.prototype, "pagination", void 0);
class EmailDto {
}
exports.EmailDto = EmailDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], EmailDto.prototype, "email", void 0);
class TZ {
}
exports.TZ = TZ;
class BusinessDto {
}
exports.BusinessDto = BusinessDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BusinessDto.prototype, "business_id", void 0);
class UserDto {
}
exports.UserDto = UserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserDto.prototype, "user_id", void 0);
var ChartType;
(function (ChartType) {
    ChartType["PIE_CHART"] = "pie-chart";
    ChartType["BAR_CHART"] = "bar-chart";
})(ChartType || (exports.ChartType = ChartType = {}));
class ChartDto {
}
exports.ChartDto = ChartDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(ChartType, {
        message: `chart type must be of the following: ${Object.values(ChartType).join(', ')}`,
    }),
    __metadata("design:type", String)
], ChartDto.prototype, "chart_type", void 0);
class CurrencyDto {
    constructor() {
        this.currency = 'NGN';
    }
}
exports.CurrencyDto = CurrencyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CurrencyDto.prototype, "currency", void 0);
class MeasurementFieldDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MeasurementFieldDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MeasurementFieldDto.prototype, "unit", void 0);
class UpperBodyDto {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "bust_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "shoulder_width", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "armhole_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "sleeve_length", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "bicep_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], UpperBodyDto.prototype, "wrist_circumference", void 0);
class LowerBodyDto {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], LowerBodyDto.prototype, "waist_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], LowerBodyDto.prototype, "hip_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], LowerBodyDto.prototype, "thigh_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], LowerBodyDto.prototype, "knee_circumference", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], LowerBodyDto.prototype, "trouser_length", void 0);
class FullBodyDto {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], FullBodyDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MeasurementFieldDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MeasurementFieldDto)
], FullBodyDto.prototype, "dress_length", void 0);
class MeasurementMetadataDto {
}
exports.MeasurementMetadataDto = MeasurementMetadataDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MeasurementMetadataDto.prototype, "customer_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MeasurementMetadataDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "bust_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "shoulder_width", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "armhole_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "sleeve_length", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "bicep_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "wrist_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "waist_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "hip_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "thigh_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "knee_circumference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "trouser_length", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", library_1.Decimal)
], MeasurementMetadataDto.prototype, "dress_length", void 0);
//# sourceMappingURL=generic.dto.js.map