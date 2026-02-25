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
exports.CourseIdDto = exports.BulkUpdateModulesDto = exports.UpdateModuleBulkDto = exports.UpdateModuleContentDto = exports.CreateMultipleModulesDto = exports.CreateModuleWithContentsDto = exports.CreateModuleContentDto = exports.RearrangeModulesDto = exports.UpdateModuleDto = exports.CreateModuleDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateModuleDto {
}
exports.CreateModuleDto = CreateModuleDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "course_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateModuleDto.prototype, "position", void 0);
class UpdateModuleDto {
}
exports.UpdateModuleDto = UpdateModuleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateModuleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateModuleDto.prototype, "position", void 0);
class ModulePositionDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModulePositionDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ModulePositionDto.prototype, "position", void 0);
class RearrangeModulesDto {
}
exports.RearrangeModulesDto = RearrangeModulesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ModulePositionDto),
    __metadata("design:type", Array)
], RearrangeModulesDto.prototype, "modules", void 0);
class CreateModuleContentDto {
}
exports.CreateModuleContentDto = CreateModuleContentDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Content title must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content title is required.' }),
    __metadata("design:type", String)
], CreateModuleContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Content position must be a number.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content position is required.' }),
    __metadata("design:type", Number)
], CreateModuleContentDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Multimedia ID must be a valid string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Multimedia ID is required.' }),
    __metadata("design:type", String)
], CreateModuleContentDto.prototype, "multimedia_id", void 0);
class CreateModuleWithContentsDto {
}
exports.CreateModuleWithContentsDto = CreateModuleWithContentsDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Module title must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Module title is required.' }),
    __metadata("design:type", String)
], CreateModuleWithContentsDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Module position must be a number.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Module position is required.' }),
    __metadata("design:type", Number)
], CreateModuleWithContentsDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Course ID must be a valid string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Course ID is required.' }),
    __metadata("design:type", String)
], CreateModuleWithContentsDto.prototype, "course_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Contents must be an array.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateModuleContentDto),
    __metadata("design:type", Array)
], CreateModuleWithContentsDto.prototype, "contents", void 0);
class CreateMultipleModulesDto {
}
exports.CreateMultipleModulesDto = CreateMultipleModulesDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Modules must be an array.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateModuleWithContentsDto),
    __metadata("design:type", Array)
], CreateMultipleModulesDto.prototype, "modules", void 0);
class UpdateModuleContentDto {
}
exports.UpdateModuleContentDto = UpdateModuleContentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateModuleContentDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateModuleContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateModuleContentDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateModuleContentDto.prototype, "multimedia_id", void 0);
class UpdateModuleBulkDto {
}
exports.UpdateModuleBulkDto = UpdateModuleBulkDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModuleBulkDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateModuleBulkDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateModuleBulkDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateModuleBulkDto.prototype, "course_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateModuleContentDto),
    __metadata("design:type", Array)
], UpdateModuleBulkDto.prototype, "contents", void 0);
class BulkUpdateModulesDto {
}
exports.BulkUpdateModulesDto = BulkUpdateModulesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateModuleBulkDto),
    __metadata("design:type", Array)
], BulkUpdateModulesDto.prototype, "modules", void 0);
class CourseIdDto {
}
exports.CourseIdDto = CourseIdDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CourseIdDto.prototype, "course_id", void 0);
//# sourceMappingURL=module.dto.js.map