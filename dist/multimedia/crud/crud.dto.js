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
exports.FilterMultimediaDto = exports.CreateMultimediaDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const generic_dto_1 = require("../../generic/generic.dto");
class CreateMultimediaDto {
}
exports.CreateMultimediaDto = CreateMultimediaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMultimediaDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MultimediaType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMultimediaDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MultimediaProvider),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMultimediaDto.prototype, "provider", void 0);
class FilterMultimediaDto extends generic_dto_1.QueryDto {
}
exports.FilterMultimediaDto = FilterMultimediaDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterMultimediaDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterMultimediaDto.prototype, "q", void 0);
//# sourceMappingURL=crud.dto.js.map