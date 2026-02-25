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
exports.EnrolledCourseController = void 0;
const common_1 = require("@nestjs/common");
const enrolled_service_1 = require("./enrolled.service");
const role_decorator_1 = require("../../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../../generic/generic.data");
const generic_dto_1 = require("../../../generic/generic.dto");
const enrolled_payload_1 = require("./enrolled.payload");
let EnrolledCourseController = class EnrolledCourseController {
    constructor(enrolledCourseService) {
        this.enrolledCourseService = enrolledCourseService;
    }
    fetch(request, queryDto) {
        return this.enrolledCourseService.fetch(request, queryDto);
    }
    fetchSingle(request, param) {
        return this.enrolledCourseService.fetchSingle(request, param);
    }
    fetchByCourseId(request, courseId) {
        return this.enrolledCourseService.fetchByCourseId(request, courseId);
    }
    update(request, param) {
        return this.enrolledCourseService.updateLessonProgress(request, param);
    }
};
exports.EnrolledCourseController = EnrolledCourseController;
__decorate([
    (0, common_1.Get)('fetch'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], EnrolledCourseController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], EnrolledCourseController.prototype, "fetchSingle", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EnrolledCourseController.prototype, "fetchByCourseId", null);
__decorate([
    (0, common_1.Patch)(':content_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, enrolled_payload_1.ContentIdDto]),
    __metadata("design:returntype", Promise)
], EnrolledCourseController.prototype, "update", null);
exports.EnrolledCourseController = EnrolledCourseController = __decorate([
    (0, common_1.Controller)('v1/enrolled-course'),
    __metadata("design:paramtypes", [enrolled_service_1.EnrolledCourseService])
], EnrolledCourseController);
//# sourceMappingURL=enrolled.controller.js.map