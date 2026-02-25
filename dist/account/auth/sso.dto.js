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
exports.AppleSSODto = exports.PlatformTypes = exports.SSODto = exports.OnboardActionType = exports.SigninOptionProvider = exports.SigninOption = exports.Platform = void 0;
const generic_data_1 = require("../../generic/generic.data");
const class_validator_1 = require("class-validator");
var Platform;
(function (Platform) {
    Platform["WEB"] = "web";
    Platform["MOBILE"] = "mobile";
})(Platform || (exports.Platform = Platform = {}));
var SigninOption;
(function (SigninOption) {
    SigninOption["INTERNAL"] = "INTERNAL";
    SigninOption["GOOGLE"] = "GOOGLE";
    SigninOption["APPLE"] = "APPLE";
})(SigninOption || (exports.SigninOption = SigninOption = {}));
var SigninOptionProvider;
(function (SigninOptionProvider) {
    SigninOptionProvider["GOOGLE"] = "GOOGLE";
    SigninOptionProvider["APPLE"] = "APPLE";
})(SigninOptionProvider || (exports.SigninOptionProvider = SigninOptionProvider = {}));
var OnboardActionType;
(function (OnboardActionType) {
    OnboardActionType["SIGNUP"] = "SIGNUP";
    OnboardActionType["SIGNIN"] = "SIGNIN";
})(OnboardActionType || (exports.OnboardActionType = OnboardActionType = {}));
class SSODto {
}
exports.SSODto = SSODto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SSODto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(SigninOptionProvider),
    __metadata("design:type", String)
], SSODto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Platform),
    __metadata("design:type", String)
], SSODto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(generic_data_1.Role),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SSODto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(OnboardActionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SSODto.prototype, "action_type", void 0);
var PlatformTypes;
(function (PlatformTypes) {
    PlatformTypes["IOS"] = "ios";
    PlatformTypes["ANDROID"] = "android";
    PlatformTypes["WEB"] = "web";
})(PlatformTypes || (exports.PlatformTypes = PlatformTypes = {}));
class AppleSSODto {
}
exports.AppleSSODto = AppleSSODto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppleSSODto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppleSSODto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppleSSODto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(PlatformTypes),
    __metadata("design:type", String)
], AppleSSODto.prototype, "platform", void 0);
//# sourceMappingURL=sso.dto.js.map