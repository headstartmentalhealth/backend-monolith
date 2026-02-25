"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const rbac_controller_1 = require("./rbac.controller");
const prisma_service_1 = require("../prisma/prisma.service");
const log_service_1 = require("../log/log.service");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        controllers: [rbac_controller_1.RoleGroupController, rbac_controller_1.RoleController],
        providers: [rbac_service_1.RoleGroupService, rbac_service_1.RoleService, prisma_service_1.PrismaService, log_service_1.LogService],
        exports: [rbac_service_1.RoleService],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map