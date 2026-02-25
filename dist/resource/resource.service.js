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
exports.ResourceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../log/log.service");
const generic_service_1 = require("../generic/generic.service");
const generic_utils_1 = require("../generic/generic.utils");
let ResourceService = class ResourceService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'Resource';
        this.select = {
            id: true,
            title: true,
            description: true,
            resource_type: true,
            content_url: true,
            cover_image: true,
            category: true,
            age_range: true,
            topic: true,
            minutes: true,
            business_id: true,
            creator_id: true,
            created_at: true,
            updated_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                },
            },
        };
        this.resourceRepository = new prisma_base_repository_1.PrismaBaseRepository('resource', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            const resource = await prisma.resource.create({
                data: {
                    ...dto,
                    creator: { connect: { id: auth.sub } },
                    ...(request['Business-Id'] && {
                        business_info: { connect: { id: request['Business-Id'] } },
                    }),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_RESOURCE,
                entity: 'Resource',
                entity_id: resource.id,
                metadata: `User ${auth.sub} created a ${dto.resource_type} resource: ${resource.id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Resource created successfully.',
                data: resource,
            };
        });
    }
    async fetch(payload, filterDto) {
        const auth = payload.user;
        if (payload['Business-Id']) {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
        }
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }),
            ...(filterDto.resource_type && { resource_type: filterDto.resource_type }),
            ...(filterDto.topic && { topic: filterDto.topic }),
            ...(filterDto.q && {
                OR: [
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    {
                        description: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
            deleted_at: null,
        };
        const [resources, total] = await Promise.all([
            this.resourceRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, this.select),
            this.resourceRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: resources,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        if (payload['Business-Id']) {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
        }
        const resource = await this.resourceRepository.findOne({ id: param.id, ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }), deleted_at: null }, undefined, this.select);
        if (!resource) {
            throw new common_1.NotFoundException('Resource not found.');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: resource,
        };
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing = await prisma.resource.findFirst({
                where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Resource not found.');
            }
            const resource = await prisma.resource.update({
                where: { id },
                data: dto,
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_RESOURCE,
                entity: 'Resource',
                entity_id: resource.id,
                metadata: `User ${auth.sub} updated resource: ${resource.id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Resource updated successfully.',
                data: resource,
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing = await prisma.resource.findFirst({
                where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Resource not found.');
            }
            await prisma.resource.update({
                where: { id },
                data: { deleted_at: new Date() },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_RESOURCE,
                entity: 'Resource',
                entity_id: id,
                metadata: `User ${auth.sub} deleted resource: ${id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Resource deleted successfully.',
            };
        });
    }
};
exports.ResourceService = ResourceService;
exports.ResourceService = ResourceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], ResourceService);
//# sourceMappingURL=resource.service.js.map