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
exports.MultimediaCrudController = void 0;
const common_1 = require("@nestjs/common");
const crud_service_1 = require("./crud.service");
const role_decorator_1 = require("../../account/auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const crud_dto_1 = require("./crud.dto");
const generic_dto_1 = require("../../generic/generic.dto");
let MultimediaCrudController = class MultimediaCrudController {
    constructor(multimediaCrudService) {
        this.multimediaCrudService = multimediaCrudService;
    }
    create(request, createMultimediaDto) {
        return this.multimediaCrudService.create(request, createMultimediaDto);
    }
    fetch(request, queryDto) {
        return this.multimediaCrudService.fetch(request, queryDto);
    }
    delete(request, param) {
        return this.multimediaCrudService.delete(request, param);
    }
    fetchAll(request, queryDto) {
        return this.multimediaCrudService.fetchAll(request, queryDto);
    }
};
exports.MultimediaCrudController = MultimediaCrudController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crud_dto_1.CreateMultimediaDto]),
    __metadata("design:returntype", Promise)
], MultimediaCrudController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], MultimediaCrudController.prototype, "fetch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], MultimediaCrudController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], MultimediaCrudController.prototype, "fetchAll", null);
exports.MultimediaCrudController = MultimediaCrudController = __decorate([
    (0, common_1.Controller)('v1/multimedia'),
    __metadata("design:paramtypes", [crud_service_1.MultimediaCrudService])
], MultimediaCrudController);
//# sourceMappingURL=crud.controller.js.map