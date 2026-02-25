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
exports.WithdrawNoteDto = exports.QueryWithdrawRequestsDto = exports.UpdateWithdrawalDto = exports.WithdrawalStatus = exports.VerifyWithdrawalDto = exports.FinalizeWithdrawalDto = exports.InitiateWithdrawalDto = exports.CreateWithdrawalDto = void 0;
const generic_dto_1 = require("../generic/generic.dto");
const class_validator_1 = require("class-validator");
const class_validator_2 = require("class-validator");
class CreateWithdrawalDto {
}
exports.CreateWithdrawalDto = CreateWithdrawalDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWithdrawalDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWithdrawalDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWithdrawalDto.prototype, "password", void 0);
class InitiateWithdrawalDto {
}
exports.InitiateWithdrawalDto = InitiateWithdrawalDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitiateWithdrawalDto.prototype, "withdrawalId", void 0);
class FinalizeWithdrawalDto {
}
exports.FinalizeWithdrawalDto = FinalizeWithdrawalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FinalizeWithdrawalDto.prototype, "otp", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FinalizeWithdrawalDto.prototype, "withdrawalId", void 0);
class VerifyWithdrawalDto {
}
exports.VerifyWithdrawalDto = VerifyWithdrawalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyWithdrawalDto.prototype, "reference", void 0);
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["APPROVED"] = "APPROVED";
    WithdrawalStatus["REJECTED"] = "REJECTED";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
class UpdateWithdrawalDto {
}
exports.UpdateWithdrawalDto = UpdateWithdrawalDto;
__decorate([
    (0, class_validator_2.IsEnum)(WithdrawalStatus),
    __metadata("design:type", String)
], UpdateWithdrawalDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_2.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWithdrawalDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_2.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWithdrawalDto.prototype, "processed_by", void 0);
class QueryWithdrawRequestsDto extends generic_dto_1.QueryDto {
}
exports.QueryWithdrawRequestsDto = QueryWithdrawRequestsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_2.IsOptional)(),
    __metadata("design:type", String)
], QueryWithdrawRequestsDto.prototype, "q", void 0);
class WithdrawNoteDto {
}
exports.WithdrawNoteDto = WithdrawNoteDto;
//# sourceMappingURL=withdraw.dto.js.map