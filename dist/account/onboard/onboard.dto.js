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
exports.UpdateBusinessProcessesDto = exports.OnboardingProcesses = exports.BusinessNameDto = exports.ReviewKycDto = exports.UpsertKycDto = exports.AddCustomerDto = exports.ExportBusinessUsersDto = exports.ImportBusinessUsersDto = exports.ImportBusinessUserDto = exports.FilterBusinessOwnerDto = exports.SuspendBusinessOwnerDto = exports.FilterBusinessDto = exports.UpsertWithdrawalAccountDto = exports.SaveBusinessInfoDto = exports.SocialMediaHandle = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const generic_data_1 = require("../../generic/generic.data");
const generic_dto_1 = require("../../generic/generic.dto");
const class_transformer_1 = require("class-transformer");
class SocialMediaHandle {
}
exports.SocialMediaHandle = SocialMediaHandle;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SocialMediaHandle.prototype, "handle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SocialMediaHandle.prototype, "link", void 0);
class SaveBusinessInfoDto {
    constructor() {
        this.country = generic_data_1.DEFAULT_COUNTRY;
    }
}
exports.SaveBusinessInfoDto = SaveBusinessInfoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "business_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "business_description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SocialMediaHandle),
    __metadata("design:type", Array)
], SaveBusinessInfoDto.prototype, "social_media_handles", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.BusinessSize),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "business_size", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "business_slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "timeline", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "logo_url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "working_hours", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SaveBusinessInfoDto.prototype, "country", void 0);
class UpsertWithdrawalAccountDto {
}
exports.UpsertWithdrawalAccountDto = UpsertWithdrawalAccountDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "business_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "account_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "account_type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "bank_code", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "bank_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "routing_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertWithdrawalAccountDto.prototype, "recipient_code", void 0);
class FilterBusinessDto extends generic_dto_1.QueryDto {
}
exports.FilterBusinessDto = FilterBusinessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterBusinessDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsBooleanString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterBusinessDto.prototype, "deleted", void 0);
class SuspendBusinessOwnerDto {
}
exports.SuspendBusinessOwnerDto = SuspendBusinessOwnerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SuspendBusinessOwnerDto.prototype, "suspension_reason", void 0);
class FilterBusinessOwnerDto extends generic_dto_1.QueryDto {
}
exports.FilterBusinessOwnerDto = FilterBusinessOwnerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterBusinessOwnerDto.prototype, "q", void 0);
class ImportBusinessUserDto {
}
exports.ImportBusinessUserDto = ImportBusinessUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportBusinessUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportBusinessUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportBusinessUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportBusinessUserDto.prototype, "phone", void 0);
class ImportBusinessUsersDto {
}
exports.ImportBusinessUsersDto = ImportBusinessUsersDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], ImportBusinessUsersDto.prototype, "users", void 0);
class ExportBusinessUsersDto {
}
exports.ExportBusinessUsersDto = ExportBusinessUsersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportBusinessUsersDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(generic_data_1.BusinessOwnerAccountRole),
    __metadata("design:type", String)
], ExportBusinessUsersDto.prototype, "role", void 0);
class AddCustomerDto {
}
exports.AddCustomerDto = AddCustomerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AddCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], AddCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], AddCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddCustomerDto.prototype, "business_id", void 0);
class UpsertKycDto {
}
exports.UpsertKycDto = UpsertKycDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "doc_front", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "doc_back", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "utility_doc", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertKycDto.prototype, "id_type", void 0);
class ReviewKycDto {
}
exports.ReviewKycDto = ReviewKycDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReviewKycDto.prototype, "is_approved", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewKycDto.prototype, "disapproval_reason", void 0);
class BusinessNameDto {
}
exports.BusinessNameDto = BusinessNameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BusinessNameDto.prototype, "business_name", void 0);
var OnboardingProcesses;
(function (OnboardingProcesses) {
    OnboardingProcesses["BUSINESS_DETAILS"] = "BUSINESS_DETAILS";
    OnboardingProcesses["KYC"] = "KYC";
    OnboardingProcesses["WITHDRAWAL_ACCOUNT"] = "WITHDRAWAL_ACCOUNT";
    OnboardingProcesses["TEAM_MEMBERS_INVITATION"] = "TEAM_MEMBERS_INVITATION";
    OnboardingProcesses["PRODUCT_CREATION"] = "PRODUCT_CREATION";
})(OnboardingProcesses || (exports.OnboardingProcesses = OnboardingProcesses = {}));
class UpdateBusinessProcessesDto {
}
exports.UpdateBusinessProcessesDto = UpdateBusinessProcessesDto;
__decorate([
    (0, class_validator_1.IsEnum)(OnboardingProcesses),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateBusinessProcessesDto.prototype, "process", void 0);
//# sourceMappingURL=onboard.dto.js.map