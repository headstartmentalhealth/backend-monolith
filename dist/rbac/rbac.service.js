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
exports.RoleService = exports.RoleGroupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../generic/generic.utils");
const rbac_utils_1 = require("./rbac.utils");
const log_service_1 = require("../log/log.service");
let RoleGroupService = class RoleGroupService {
    constructor(prisma) {
        this.prisma = prisma;
        this.roleGroupRepository = new prisma_base_repository_1.PrismaBaseRepository('roleGroup', prisma);
    }
    async create(createRoleDto) {
        const { name } = createRoleDto;
        const role_group = await this.roleGroupRepository.findOne({ name });
        if (role_group) {
            throw new common_1.ConflictException('Role group exists.');
        }
        await this.roleGroupRepository.create(createRoleDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Role group created successfully.',
        };
    }
    async update(id, updateRoleGroupDto) {
        const role_group = await this.roleGroupRepository.findOne({ id });
        if (!role_group) {
            throw new common_1.NotFoundException('Role group not found');
        }
        await this.roleGroupRepository.update({ id }, updateRoleGroupDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role group updated successfully',
        };
    }
    async fetch(query) {
        let { pagination } = query;
        const role_groups = await this.roleGroupRepository.findManyWithPagination({}, {
            page: +pagination?.page || generic_utils_1.PAGINATION.PAGE,
            limit: +pagination?.limit || generic_utils_1.PAGINATION.LIMIT,
        });
        const total = await this.roleGroupRepository.count({});
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role groups data retrieved successfully.',
            data: role_groups,
            count: total,
        };
    }
    async fetchSingle(id) {
        const role_group = await this.roleGroupRepository.findOne({
            id,
        });
        if (!role_group) {
            throw new common_1.NotFoundException('Role group not found');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role group data retrieved successfully.',
            data: role_group,
        };
    }
    async hasRelatedRecords(role_group_id) {
        const relatedTables = [{ model: this.prisma.role, field: 'role_group_id' }];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: { [field]: role_group_id },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async delete(id) {
        const role_group = await this.roleGroupRepository.findOne({
            id,
        });
        if (!role_group) {
            throw new common_1.NotFoundException('Role group not found');
        }
        await this.hasRelatedRecords(role_group.id);
        await this.roleGroupRepository.delete({ id });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role group deleted successfully.',
        };
    }
};
exports.RoleGroupService = RoleGroupService;
exports.RoleGroupService = RoleGroupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleGroupService);
let RoleService = class RoleService {
    constructor(prisma, roleGroupService, logService) {
        this.prisma = prisma;
        this.roleGroupService = roleGroupService;
        this.logService = logService;
        this.roleRepository = new prisma_base_repository_1.PrismaBaseRepository('role', prisma);
    }
    async create(createRoleDto) {
        const { name, role_group_id } = createRoleDto;
        await this.roleGroupService.fetchSingle(role_group_id);
        const existingRole = await this.roleRepository.findOne({ name });
        if (existingRole) {
            throw new common_1.ConflictException('Role name already exists.');
        }
        const role_id = (0, rbac_utils_1.formatRole)(name);
        await this.roleRepository.create({ ...createRoleDto, role_id });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Role created successfully.',
        };
    }
    async update(id, updateRoleDto) {
        const { name } = updateRoleDto;
        const role = await this.roleRepository.findOne({ id });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (name && name !== role.name) {
            const existingRole = await this.roleRepository.findOne({ name });
            if (existingRole) {
                throw new common_1.ConflictException('Role name already exists.');
            }
        }
        await this.roleRepository.update({ id }, updateRoleDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role updated successfully',
        };
    }
    async fetch(query) {
        const { pagination, role_group_id } = query;
        if (role_group_id) {
            await this.roleGroupService.fetchSingle(role_group_id);
        }
        const filter = (0, rbac_utils_1.filterByRoleGroup)(role_group_id);
        const include = {
            role_group: true,
        };
        const roles = await this.roleRepository.findManyWithPagination(filter, {
            page: +pagination?.page || generic_utils_1.PAGINATION.PAGE,
            limit: +pagination?.limit || generic_utils_1.PAGINATION.LIMIT,
        }, client_1.Prisma.SortOrder.desc, include);
        const total = await this.roleRepository.count(filter);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Roles retrieved successfully',
            data: roles,
            count: total,
        };
    }
    async fetchSingle(id) {
        const include = { role_group: true };
        const role = await this.roleRepository.findOne({ id }, include);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role retrieved successfully',
            data: role,
        };
    }
    async fetchOne(role_id) {
        const include = { role_group: true };
        const role = await this.roleRepository.findOne({ role_id }, include);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async fetchOneTrx(role_id, prisma) {
        const include = { role_group: true };
        const role = await prisma.role.findFirst({ where: { role_id }, include });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async hasRelatedRecords(role_identity) {
        const relatedTables = [{ model: this.prisma.user, field: 'role_identity' }];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: { [field]: role_identity },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async delete(id, request) {
        const role = await this.roleRepository.findOne({ id });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        await this.hasRelatedRecords(role.id);
        await this.roleRepository.delete({ id });
        const ipAddress = (0, generic_utils_1.getIpAddress)(request);
        const userAgent = (0, generic_utils_1.getUserAgent)(request);
        await this.logService.createLog({
            action: 'DELETE',
            entity: 'Role',
            entity_id: id,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: `Role ID ${role.id} has just been deleted`,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Role deleted successfully',
        };
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        RoleGroupService,
        log_service_1.LogService])
], RoleService);
//# sourceMappingURL=rbac.service.js.map