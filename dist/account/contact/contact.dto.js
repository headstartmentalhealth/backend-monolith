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
exports.NewsletterSubscriptionDto = exports.SendMessageDto = exports.FilterContactsDto = exports.FilterUserDto = exports.FilterInvitesDto = exports.AcceptInviteDto = exports.InviteContactDto = void 0;
const class_validator_1 = require("class-validator");
const generic_dto_1 = require("../../generic/generic.dto");
const class_validator_2 = require("class-validator");
const client_1 = require("@prisma/client");
const generic_data_1 = require("../../generic/generic.data");
class InviteContactDto extends generic_dto_1.EmailDto {
}
exports.InviteContactDto = InviteContactDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_2.IsUUID)(),
    __metadata("design:type", String)
], InviteContactDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], InviteContactDto.prototype, "name", void 0);
class AcceptInviteDto {
}
exports.AcceptInviteDto = AcceptInviteDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_2.IsUUID)(),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "password", void 0);
class FilterInvitesDto {
}
exports.FilterInvitesDto = FilterInvitesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberStatus, {
        message: `Status must be one of: ${Object.keys(client_1.MemberStatus).join(', ')}`,
    }),
    __metadata("design:type", String)
], FilterInvitesDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(generic_data_1.BusinessOwnerAccountRole),
    __metadata("design:type", String)
], FilterInvitesDto.prototype, "role", void 0);
class FilterUserDto extends generic_dto_1.QueryDto {
}
exports.FilterUserDto = FilterUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterUserDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_2.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterUserDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(generic_data_1.Role, {
        message: `Role must be one of: ${Object.keys(generic_data_1.Role).join(', ')}`,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FilterUserDto.prototype, "business_contacts", void 0);
class FilterContactsDto extends generic_dto_1.QueryDto {
}
exports.FilterContactsDto = FilterContactsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterContactsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_2.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FilterContactsDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(generic_data_1.Role, {
        message: `Role must be one of: ${Object.keys(generic_data_1.Role).join(', ')}`,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterContactsDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FilterContactsDto.prototype, "business_contacts", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "inquiry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "organization", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "captcha_token", void 0);
class NewsletterSubscriptionDto {
}
exports.NewsletterSubscriptionDto = NewsletterSubscriptionDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], NewsletterSubscriptionDto.prototype, "email", void 0);
//# sourceMappingURL=contact.dto.js.map