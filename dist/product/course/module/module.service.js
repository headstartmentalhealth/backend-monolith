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
exports.CourseModuleService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../../generic/generic.utils");
const crud_service_1 = require("../crud/crud.service");
const module_utils_1 = require("./module.utils");
let CourseModuleService = class CourseModuleService {
    constructor(prisma, logService, genericService, courseCrudService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.courseCrudService = courseCrudService;
        this.select = {
            id: true,
            title: true,
            position: true,
            course_id: true,
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
            course: true,
        };
        this.moduleRepository = new prisma_base_repository_1.PrismaBaseRepository('module', prisma);
    }
    async create(request, createModuleDto) {
        const auth = request.user;
        const { course_id } = createModuleDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            await this.courseCrudService.findOne(course_id);
            const module = await prisma.module.create({
                data: {
                    title: createModuleDto.title,
                    position: createModuleDto.position,
                    course: { connect: { id: createModuleDto.course_id } },
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE_MODULE,
                entity: 'Module',
                entity_id: module.id,
                metadata: `User with ID ${auth.sub} just created a course module ID ${module.id} for Business ID ${module.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Course module created successfully.',
            };
        });
    }
    async fetch(payload, queryDto, courseIdDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            business_id: payload['Business-Id'],
            course_id: courseIdDto.course_id,
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            contents: { include: { multimedia: true } },
        };
        const [modules, total] = await Promise.all([
            this.moduleRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.asc, undefined, select),
            this.moduleRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: modules,
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
            contents: true,
        };
        const filters = {
            id: param.id,
        };
        const module = await this.moduleRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: module,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const module = await this.moduleRepository.findOne(filters, undefined, select);
        if (!module) {
            throw new common_1.NotFoundException(`Module not found.`);
        }
        return module;
    }
    async update(request, param, updateModuleDto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_module = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            await prisma.module.update({
                where: { id },
                data: {
                    ...updateModuleDto,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE_MODULE,
                entity: 'Module',
                entity_id: existing_module.id,
                metadata: `User with ID ${auth.sub} just updated a course module ID ${existing_module.id} for business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Course module updated successfully.',
            };
        });
    }
    async hasRelatedRecords(module_id) {
        const relatedTables = [
            { model: this.prisma.moduleContent, field: 'module_id' },
        ];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: { [field]: module_id },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const existing_module = await this.findOne(id);
            await this.hasRelatedRecords(existing_module.id);
            await prisma.module.update({
                where: { id: existing_module.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE_MODULE,
                entity: 'Module',
                entity_id: existing_module.id,
                metadata: `User with ID ${auth.sub} just deleted a course module ID ${existing_module.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Course module deleted successfully.',
            };
        });
    }
    async rearrange(request, param, dto) {
        const auth = request.user;
        const { course_id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const course = await prisma.product.findUnique({
                where: { id: course_id },
                include: { modules: true },
            });
            if (!course) {
                throw new common_1.NotFoundException(`Course with ID ${course_id} not found`);
            }
            const moduleIds = course.modules.map((content) => content.id);
            const invalidModuleIds = dto.modules
                .map((module) => module.id)
                .filter((id) => !moduleIds.includes(id));
            if (invalidModuleIds.length > 0) {
                throw new common_1.NotFoundException(`Invalid module IDs: ${invalidModuleIds.join(', ')}`);
            }
            const updatePromises = dto.modules.map((module) => this.prisma.module.update({
                where: { id: module.id },
                data: { position: module.position },
            }));
            await Promise.all(updatePromises);
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE_MODULE,
                entity: 'Module',
                metadata: `User with ID ${auth.sub} just rearranged the modules of course ID ${course.id} for Business ID ${course.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Course module rearranged successfully.',
            };
        });
    }
    async createMultipleModulesWithContents(request, dto) {
        const { user } = request;
        const businessId = request['Business-Id'];
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: user.sub,
                business_id: businessId,
            });
            await Promise.all(dto.modules.map(({ course_id }) => this.courseCrudService.findOne(course_id)));
            const created_modules = await Promise.all(dto.modules.map(async (module) => {
                const newModule = await prisma.module.create({
                    data: {
                        title: module.title,
                        position: module.position,
                        course_id: module.course_id,
                        creator_id: user.sub,
                        business_id: businessId,
                        contents: {
                            create: module.contents?.map((content) => ({
                                title: content.title,
                                position: content.position,
                                multimedia_id: content.multimedia_id,
                                creator_id: user.sub,
                                business_id: businessId,
                            })) || [],
                        },
                    },
                });
                return newModule;
            }));
            const total_contents = await prisma.moduleContent.count({
                where: {
                    module: { course_id: dto.modules[0].course_id },
                },
            });
            const readiness_percent = (0, module_utils_1.getReadinessPercent)(total_contents);
            await prisma.product.update({
                where: { id: dto.modules[0].course_id },
                data: { readiness_percent },
            });
            await prisma.log.createMany({
                data: created_modules.map((mod) => ({
                    user_id: user.sub,
                    action: client_1.Action.MANAGE_COURSE_MODULE,
                    entity: 'Module',
                    entity_id: mod.id,
                    metadata: `User with ID ${user.sub} created module ID ${mod.id} under business ID ${businessId}.`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                })),
            });
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: `${created_modules.length} module(s) and their contents created successfully.`,
            };
        });
    }
    async bulkUpdateModules(request, dto) {
        const auth = request.user;
        const ipAddress = (0, generic_utils_1.getIpAddress)(request);
        const userAgent = (0, generic_utils_1.getUserAgent)(request);
        await this.prisma.$transaction(async (prisma) => {
            const moduleIds = dto.modules.map((m) => m.id).filter(Boolean);
            const existingModules = await prisma.module.findMany({
                where: { id: { in: moduleIds } },
                select: {
                    id: true,
                    business_id: true,
                    course_id: true,
                    contents: {
                        select: { id: true },
                    },
                },
            });
            const moduleMap = new Map(existingModules.map((m) => [m.id, m]));
            const uniqueBusinessIds = [
                ...new Set(existingModules.map((m) => m.business_id)),
            ];
            if (uniqueBusinessIds.length > 1) {
                throw new common_1.BadRequestException('Modules must belong to the same business');
            }
            const business_id = uniqueBusinessIds[0] || request['Business-Id'];
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id,
            });
            for (const moduleDto of dto.modules) {
                let moduleId = moduleDto.id;
                let createdModule;
                if (moduleId) {
                    await prisma.module.update({
                        where: { id: moduleId },
                        data: {
                            title: moduleDto.title,
                            position: moduleDto.position,
                            updated_at: new Date(),
                        },
                    });
                }
                else {
                    const newModule = await prisma.module.create({
                        data: {
                            title: moduleDto.title,
                            position: moduleDto.position,
                            course_id: moduleDto.course_id,
                            creator_id: auth.sub,
                            business_id,
                        },
                    });
                    moduleId = newModule.id;
                    createdModule = newModule;
                }
                const existingModule = moduleMap.get(moduleDto.id);
                const existingContentIds = existingModule
                    ? existingModule.contents.map((c) => c.id)
                    : [];
                const incomingContentIds = moduleDto.contents
                    .map((c) => c.id)
                    .filter(Boolean);
                if (existingContentIds.length > 0) {
                    const contentsToDelete = existingContentIds.filter((id) => !incomingContentIds.includes(id));
                    if (contentsToDelete.length > 0) {
                        await prisma.moduleContent.deleteMany({
                            where: {
                                id: { in: contentsToDelete },
                                module_id: moduleDto.id,
                            },
                        });
                    }
                }
                for (const content of moduleDto.contents) {
                    if (content.id) {
                        await prisma.moduleContent.update({
                            where: { id: content.id },
                            data: {
                                title: content.title,
                                position: content.position,
                                multimedia_id: content.multimedia_id,
                                updated_at: new Date(),
                            },
                        });
                    }
                    else {
                        await prisma.moduleContent.create({
                            data: {
                                title: content.title,
                                position: content.position,
                                multimedia_id: content.multimedia_id,
                                module_id: moduleId,
                                creator_id: auth.sub,
                                business_id,
                            },
                        });
                    }
                }
                const total_contents = await prisma.moduleContent.count({
                    where: {
                        module: { course_id: moduleDto.course_id },
                    },
                });
                const readiness_percent = (0, module_utils_1.getReadinessPercent)(total_contents);
                await prisma.product.update({
                    where: { id: moduleDto.course_id },
                    data: { readiness_percent },
                });
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.MANAGE_COURSE_MODULE,
                    entity: 'Module',
                    entity_id: moduleId,
                    metadata: `User ${auth.sub} ${moduleDto.id ? 'updated' : 'created'} module ${moduleDto.title} with ${moduleDto.contents.length} contents`,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                }, prisma.log);
            }
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: `${dto.modules.length} modules and their contents processed successfully`,
        };
    }
};
exports.CourseModuleService = CourseModuleService;
exports.CourseModuleService = CourseModuleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService,
        crud_service_1.CourseCrudService])
], CourseModuleService);
//# sourceMappingURL=module.service.js.map