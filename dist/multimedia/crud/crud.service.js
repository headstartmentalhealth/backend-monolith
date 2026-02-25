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
exports.MultimediaCrudService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const log_service_1 = require("../../log/log.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../generic/generic.utils");
let MultimediaCrudService = class MultimediaCrudService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.select = {
            id: true,
            url: true,
            type: true,
            provider: true,
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
        };
        this.multimediaRepository = new prisma_base_repository_1.PrismaBaseRepository('multimedia', prisma);
    }
    async create(request, createMultimediaDto) {
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            if (request['Business-Id']) {
                await this.genericService.isUserLinkedToBusiness(prisma, {
                    user_id: auth.sub,
                    business_id: request['Business-Id'],
                });
            }
            const multimedia = await prisma.multimedia.create({
                data: {
                    url: createMultimediaDto.url,
                    type: createMultimediaDto.type,
                    provider: createMultimediaDto.provider,
                    creator: { connect: { id: auth.sub } },
                    ...(request['Business-Id'] && {
                        business_info: { connect: { id: request['Business-Id'] } },
                    }),
                },
                select: this.select,
            });
            let metadata = `User with ID ${auth.sub} just created a multimedia ID ${multimedia.id}.`;
            if (request['Business-Id']) {
                metadata = `User with ID ${auth.sub} just created a multimedia ID ${multimedia.id} for Business ID ${multimedia.business_id}.`;
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MULTIMEDIA,
                entity: 'Multimedia',
                entity_id: multimedia.id,
                metadata,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Media content created successfully.',
                data: multimedia,
            };
        });
    }
    async createMany(request, createMultimediaDtos) {
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            if (request['Business-Id']) {
                await this.genericService.isUserLinkedToBusiness(prisma, {
                    user_id: auth.sub,
                    business_id: request['Business-Id'],
                });
            }
            const createdMultimedia = await Promise.all(createMultimediaDtos.map((dto) => prisma.multimedia.create({
                data: {
                    url: dto.url,
                    type: dto.type,
                    provider: dto.provider,
                    creator_id: auth.sub,
                    ...(request['Business-Id'] && {
                        business_id: request['Business-Id'],
                    }),
                },
                select: this.select,
            })));
            let metadata = `User with ID ${auth.sub} just created ${createdMultimedia.length} multimedia.`;
            if (request['Business-Id']) {
                metadata = `User with ID ${auth.sub} just created ${createdMultimedia.length} multimedia for Business ID ${request['Business-Id']}.`;
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MULTIMEDIA,
                entity: 'Multimedia',
                metadata,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Media content(s) created successfully.',
                data: createdMultimedia,
            };
        });
    }
    async fetch(payload, queryDto) {
        const auth = payload.user;
        if (payload['Business-Id']) {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
        }
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            business_id: payload['Business-Id'],
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [multimedia, total] = await Promise.all([
            this.multimediaRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.multimediaRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: multimedia,
            count: total,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const content = await this.multimediaRepository.findOne(filters, undefined, select);
        if (!content) {
            throw new common_1.NotFoundException(`Media content not found.`);
        }
        return content;
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const existing_media = await this.findOne(id);
            await prisma.multimedia.update({
                where: { id: existing_media.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_MULTIMEDIA,
                entity: 'Multimedia',
                entity_id: existing_media.id,
                metadata: `User with ID ${auth.sub} just deleted a multimedia ID ${existing_media.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Media content deleted successfully.',
            };
        });
    }
    async fetchAll(payload, filterMultimediaDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterMultimediaDto);
        const filters = {
            ...(filterMultimediaDto.business_id && {
                business_id: {
                    equals: filterMultimediaDto.business_id,
                },
            }),
            ...(filterMultimediaDto.q && {
                OR: [
                    {
                        id: { contains: filterMultimediaDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            business_id: true,
            business_info: true,
        };
        const [multimedia, total] = await Promise.all([
            this.multimediaRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.multimediaRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: multimedia,
            count: total,
        };
    }
};
exports.MultimediaCrudService = MultimediaCrudService;
exports.MultimediaCrudService = MultimediaCrudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], MultimediaCrudService);
//# sourceMappingURL=crud.service.js.map