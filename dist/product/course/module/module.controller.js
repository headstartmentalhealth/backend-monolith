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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseModuleController = void 0;
const business_guard_1 = require("../../../generic/guards/business.guard");
const common_1 = require("@nestjs/common");
const module_service_1 = require("./module.service");
const role_decorator_1 = require("../../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../../generic/generic.data");
const module_dto_1 = require("./module.dto");
const generic_dto_1 = require("../../../generic/generic.dto");
let CourseModuleController = class CourseModuleController {
    constructor(moduleService) {
        this.moduleService = moduleService;
    }
    create(request, createModuleDto) {
        return this.moduleService.create(request, createModuleDto);
    }
    fetch(request, queryDto, courseIdDto) {
        return this.moduleService.fetch(request, queryDto, courseIdDto);
    }
    async fetchSingle(request, param) {
        return this.moduleService.fetchSingle(request, param);
    }
    update(request, param, updateModuleDto) {
        return this.moduleService.update(request, param, updateModuleDto);
    }
    delete(request, param) {
        return this.moduleService.delete(request, param);
    }
    async rearrange(request, param, dto) {
        return this.moduleService.rearrange(request, param, dto);
    }
    createMultiple(request, dto) {
        return this.moduleService.createMultipleModulesWithContents(request, dto);
    }
    async bulkUpdateModules(request, dto) {
        return this.moduleService.bulkUpdateModules(request, dto);
    }
};
exports.CourseModuleController = CourseModuleController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, module_dto_1.CreateModuleDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':course_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.QueryDto,
        module_dto_1.CourseIdDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "fetchSingle", null);
__decorate([
    (0, common_1.Patch)(':id/update'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto,
        module_dto_1.UpdateModuleDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':course_id/rearrange'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, module_dto_1.RearrangeModulesDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "rearrange", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, module_dto_1.CreateMultipleModulesDto]),
    __metadata("design:returntype", void 0)
], CourseModuleController.prototype, "createMultiple", null);
__decorate([
    (0, common_1.Patch)('bulk-update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, module_dto_1.BulkUpdateModulesDto]),
    __metadata("design:returntype", Promise)
], CourseModuleController.prototype, "bulkUpdateModules", null);
exports.CourseModuleController = CourseModuleController = __decorate([
    (0, common_1.Controller)('v1/course-module'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __metadata("design:paramtypes", [module_service_1.CourseModuleService])
], CourseModuleController);
//# sourceMappingURL=module.controller.js.map