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
exports.ModuleContentService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../../generic/generic.utils");
const module_service_1 = require("../module/module.service");
let ModuleContentService = class ModuleContentService {
    constructor(prisma, logService, genericService, courseModuleService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.courseModuleService = courseModuleService;
        this.select = {
            id: true,
            title: true,
            position: true,
            module_id: true,
            multimedia_id: true,
            creator_id: true,
            created_at: true,
            updated_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            module: true,
            multimedia: true,
        };
        this.moduleContentRepository = new prisma_base_repository_1.PrismaBaseRepository('moduleContent', prisma);
    }
    async create(request, createModuleContentDto) {
        const auth = request.user;
        const { module_id } = createModuleContentDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            await this.courseModuleService.findOne(module_id);
            const module_content = await prisma.moduleContent.create({
                data: {
                    title: createModuleContentDto.title,
                    position: createModuleContentDto.position,
                    module: { connect: { id: createModuleContentDto.module_id } },
                    multimedia: { connect: { id: createModuleContentDto.multimedia_id } },
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MODULE_CONTENT,
                entity: 'ModuleContent',
                entity_id: module_content.id,
                metadata: `User with ID ${auth.sub} just created a module content ID ${module.id} for Business ID ${module_content.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Module content created successfully.',
            };
        });
    }
    async fetch(payload, queryDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            business_id: payload['Business-Id'],
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [module_contents, total] = await Promise.all([
            this.moduleContentRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.moduleContentRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: module_contents,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const select = {
            ...this.select,
            business_info: true,
        };
        const filters = {
            id: param.id,
        };
        const module_content = await this.moduleContentRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: module_content,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const module_content = await this.moduleContentRepository.findOne(filters, undefined, select);
        if (!module_content) {
            throw new common_1.NotFoundException(`Module content not found.`);
        }
        return module_content;
    }
    async update(request, param, updateModuleContentDto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_module_content = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            await prisma.moduleContent.update({
                where: { id },
                data: {
                    ...updateModuleContentDto,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MODULE_CONTENT,
                entity: 'ModuleContent',
                entity_id: existing_module_content.id,
                metadata: `User with ID ${auth.sub} just updated a module content ID ${existing_module_content.id} for business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Module content updated successfully.',
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const existing_module_content = await this.findOne(id);
            await prisma.moduleContent.update({
                where: { id: existing_module_content.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MODULE_CONTENT,
                entity: 'Module',
                entity_id: existing_module_content.id,
                metadata: `User with ID ${auth.sub} just deleted a module content ID ${existing_module_content.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Module content deleted successfully.',
            };
        });
    }
    async rearrange(request, param, dto) {
        const auth = request.user;
        const { module_id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const module = await prisma.module.findUnique({
                where: { id: module_id },
                include: { contents: true },
            });
            if (!module) {
                throw new common_1.NotFoundException(`Module with ID ${module_id} not found`);
            }
            const moduleContentIds = module.contents.map((content) => content.id);
            const invalidContentIds = dto.contents
                .map((content) => content.id)
                .filter((id) => !moduleContentIds.includes(id));
            if (invalidContentIds.length > 0) {
                throw new common_1.NotFoundException(`Invalid content IDs: ${invalidContentIds.join(', ')}`);
            }
            const updatePromises = dto.contents.map((content) => this.prisma.moduleContent.update({
                where: { id: content.id },
                data: { position: content.position },
            }));
            await Promise.all(updatePromises);
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MODULE_CONTENT,
                entity: 'ModuleContent',
                metadata: `User with ID ${auth.sub} just rearranged the contents of module ID ${module.id} for Business ID ${module.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Module contents rearranged successfully.',
            };
        });
    }
};
exports.ModuleContentService = ModuleContentService;
exports.ModuleContentService = ModuleContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService,
        module_service_1.CourseModuleService])
], ModuleContentService);
//# sourceMappingURL=module-content.service.js.map