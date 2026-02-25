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
exports.LogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../generic/generic.utils");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
let LogService = class LogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logRepository = new prisma_base_repository_1.PrismaBaseRepository('log', prisma);
    }
    async createLog(createLogDto) {
        return this.logRepository.create({
            ...createLogDto,
            metadata: (0, generic_utils_1.maskSensitive)(createLogDto.metadata),
        });
    }
    async createWithTrx(createLogDto, logRepo) {
        return await logRepo.create({
            data: { ...createLogDto, metadata: (0, generic_utils_1.maskSensitive)(createLogDto.metadata) },
        });
    }
    async fetch(payload, filterLogDto) {
        let { startDate, endDate } = filterLogDto;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterLogDto);
        const filters = {
            ...(filterLogDto.q && {
                OR: [
                    {
                        ip_address: { contains: filterLogDto.q, mode: 'insensitive' },
                    },
                    {
                        user_agent: { contains: filterLogDto.q, mode: 'insensitive' },
                    },
                    {
                        entity: { contains: filterLogDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const includes = {
            user: {
                select: {
                    role: {
                        select: {
                            id: true,
                            role_id: true,
                        },
                    },
                },
            },
        };
        const [logs, total] = await Promise.all([
            this.logRepository.findManyWithPagination(filters, {
                ...pagination_filters.pagination_options,
            }, client_1.Prisma.SortOrder.desc, includes, undefined),
            this.logRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Logs retrieved successfully',
            data: logs,
            count: total,
        };
    }
    async fetchSingle(where) {
        const log_details = await this.logRepository.findOne({ where });
        return log_details;
    }
};
exports.LogService = LogService;
exports.LogService = LogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogService);
//# sourceMappingURL=log.service.js.map