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
exports.RoleController = exports.RoleGroupController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const rbac_dto_1 = require("./rbac.dto");
const generic_dto_1 = require("../generic/generic.dto");
let RoleGroupController = class RoleGroupController {
    constructor(roleGroupService) {
        this.roleGroupService = roleGroupService;
    }
    async create(createRoleGroupDto) {
        return this.roleGroupService.create(createRoleGroupDto);
    }
    async fetch(query) {
        return this.roleGroupService.fetch(query);
    }
    async get(id) {
        return this.roleGroupService.fetchSingle(id);
    }
    async update(id, updateRoleGroupDto) {
        return this.roleGroupService.update(id, updateRoleGroupDto);
    }
    async delete(id) {
        return await this.roleGroupService.delete(id);
    }
};
exports.RoleGroupController = RoleGroupController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_dto_1.CreateRoleGroupDto]),
    __metadata("design:returntype", Promise)
], RoleGroupController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, forbidNonWhitelisted: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_dto_1.QueryDto]),
    __metadata("design:returntype", Promise)
], RoleGroupController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleGroupController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoleGroupController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleGroupController.prototype, "delete", null);
exports.RoleGroupController = RoleGroupController = __decorate([
    (0, common_1.Controller)('v1/role-group'),
    __metadata("design:paramtypes", [rbac_service_1.RoleGroupService])
], RoleGroupController);
let RoleController = class RoleController {
    constructor(roleService) {
        this.roleService = roleService;
    }
    async create(createRoleDto) {
        return this.roleService.create(createRoleDto);
    }
    async fetch(query) {
        return this.roleService.fetch(query);
    }
    async get(id) {
        return this.roleService.fetchSingle(id);
    }
    async update(id, updateRoleDto) {
        return this.roleService.update(id, updateRoleDto);
    }
    async delete(id, request) {
        return await this.roleService.delete(id, request);
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, forbidNonWhitelisted: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_dto_1.RoleQueryDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Request]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "delete", null);
exports.RoleController = RoleController = __decorate([
    (0, common_1.Controller)('v1/role'),
    __metadata("design:paramtypes", [rbac_service_1.RoleService])
], RoleController);
//# sourceMappingURL=rbac.controller.js.map