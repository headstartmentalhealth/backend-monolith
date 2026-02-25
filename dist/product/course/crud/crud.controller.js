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
exports.CourseCrudController = void 0;
const common_1 = require("@nestjs/common");
const crud_service_1 = require("./crud.service");
const crud_dto_1 = require("./crud.dto");
const role_decorator_1 = require("../../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../../generic/generic.data");
const generic_dto_1 = require("../../../generic/generic.dto");
const business_guard_1 = require("../../../generic/guards/business.guard");
let CourseCrudController = class CourseCrudController {
    constructor(courseService) {
        this.courseService = courseService;
    }
    create(request, createCourseDto) {
        return this.courseService.create(request, createCourseDto);
    }
    fetch(request, filterCourseDto) {
        return this.courseService.fetch(request, filterCourseDto);
    }
    fetchSingle(request, param) {
        return this.courseService.fetchSingle(request, param);
    }
    update(request, param, updateCourseDto) {
        return this.courseService.update(request, param, updateCourseDto);
    }
    delete(request, param) {
        return this.courseService.delete(request, param);
    }
    bulkCreate(request, dto) {
        return this.courseService.bulkCreate(request, dto);
    }
};
exports.CourseCrudController = CourseCrudController;
__decorate([
    (0, common_1.Post)('create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.CreateCourseDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.FilterCourseDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "fetchSingle", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto,
        crud_dto_1.UpdateCourseDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('bulk-create'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.BulkCreateCourseDto]),
    __metadata("design:returntype", Promise)
], CourseCrudController.prototype, "bulkCreate", null);
exports.CourseCrudController = CourseCrudController = __decorate([
    (0, common_1.Controller)('v1/product-course-crud'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __metadata("design:paramtypes", [crud_service_1.CourseCrudService])
], CourseCrudController);
//# sourceMappingURL=crud.controller.js.map