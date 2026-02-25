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
exports.ModuleContentController = void 0;
const business_guard_1 = require("../../../generic/guards/business.guard");
const common_1 = require("@nestjs/common");
const module_content_service_1 = require("./module-content.service");
const role_decorator_1 = require("../../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../../generic/generic.data");
const module_content_dto_1 = require("./module-content.dto");
const generic_dto_1 = require("../../../generic/generic.dto");
let ModuleContentController = class ModuleContentController {
    constructor(moduleContentService) {
        this.moduleContentService = moduleContentService;
    }
    create(request, createModuleContentDto) {
        return this.moduleContentService.create(request, createModuleContentDto);
    }
    fetch(request, queryDto) {
        return this.moduleContentService.fetch(request, queryDto);
    }
    async fetchSingle(request, param) {
        return this.moduleContentService.fetchSingle(request, param);
    }
    update(request, param, updateModuleContentDto) {
        return this.moduleContentService.update(request, param, updateModuleContentDto);
    }
    delete(request, param) {
        return this.moduleContentService.delete(request, param);
    }
    async rearrange(request, param, dto) {
        return this.moduleContentService.rearrange(request, param, dto);
    }
};
exports.ModuleContentController = ModuleContentController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, module_content_dto_1.CreateModuleContentDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "fetchSingle", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto,
        module_content_dto_1.UpdateModuleContentDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':module_id/rearrange'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, module_content_dto_1.RearrangeModuleContentsDto]),
    __metadata("design:returntype", Promise)
], ModuleContentController.prototype, "rearrange", null);
exports.ModuleContentController = ModuleContentController = __decorate([
    (0, common_1.Controller)('v1/course-module-content'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __metadata("design:paramtypes", [module_content_service_1.ModuleContentService])
], ModuleContentController);
//# sourceMappingURL=module-content.controller.js.map