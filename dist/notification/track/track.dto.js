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
exports.FilterScheduledDto = exports.FilterNotificationsDto = exports.FetchScheduledNotificationsDto = exports.FetchInstantNotificationsDto = void 0;
const generic_dto_1 = require("../../generic/generic.dto");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class FetchInstantNotificationsDto {
}
exports.FetchInstantNotificationsDto = FetchInstantNotificationsDto;
class FetchScheduledNotificationsDto {
}
exports.FetchScheduledNotificationsDto = FetchScheduledNotificationsDto;
class FilterNotificationsDto extends generic_dto_1.QueryDto {
}
exports.FilterNotificationsDto = FilterNotificationsDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], FilterNotificationsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationType, {
        message: `type must be of the following: ${Object.values(client_1.NotificationType).join(', ')}`,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], FilterNotificationsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterNotificationsDto.prototype, "q", void 0);
class FilterScheduledDto extends FilterNotificationsDto {
}
exports.FilterScheduledDto = FilterScheduledDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationStatus, {
        message: `schedule status must be of the following: ${Object.values(client_1.NotificationStatus).join(', ')}`,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], FilterScheduledDto.prototype, "schedule_status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterScheduledDto.prototype, "q", void 0);
//# sourceMappingURL=track.dto.js.map