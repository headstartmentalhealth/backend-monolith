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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../../log/log.service");
const generic_service_1 = require("../../generic/generic.service");
const generic_utils_1 = require("../../generic/generic.utils");
let BillingService = class BillingService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'BillingInformation';
        this.select = {
            id: true,
            address: true,
            city: true,
            state: true,
            apartment: true,
            postal_code: true,
            country: true,
            selected: true,
            country_code: true,
            created_at: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
        };
        this.billingInformationRepository = new prisma_base_repository_1.PrismaBaseRepository('billingInformation', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        const { address, state, apartment, postal_code, country, city, selected } = dto;
        return this.prisma.$transaction(async (prisma) => {
            const country_name = (0, generic_utils_1.getCountryName)(country);
            if (!country_name) {
                throw new common_1.NotFoundException(`Country code '${country}' not found`);
            }
            const existing_billing_info = await prisma.billingInformation.findFirst({
                where: {
                    address,
                    state,
                    apartment,
                    postal_code,
                    country,
                    city,
                },
            });
            if (existing_billing_info) {
                throw new common_1.ConflictException('Billing information exists.');
            }
            if (selected) {
                await prisma.billingInformation.updateMany({
                    where: { user_id: auth.sub },
                    data: { selected: false },
                });
            }
            const billing_info = await prisma.billingInformation.create({
                data: {
                    ...dto,
                    user_id: auth.sub,
                    country_code: country,
                    country: country_name,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BILLING,
                entity: this.model,
                entity_id: billing_info.id,
                metadata: `User with ID ${auth.sub} just created a billing info of ID ${billing_info.id} for country ${country}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Billing information created successfully.',
            };
        });
    }
    async fetch(payload, queryDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            user_id: auth.sub,
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [billingInfo, total] = await Promise.all([
            this.billingInformationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.billingInformationRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: billingInfo,
            count: total,
        };
    }
    async findOne(id, user_id) {
        const select = this.select;
        const filters = {
            id,
            user_id,
        };
        const billingInformation = await this.billingInformationRepository.findOne(filters, undefined, select);
        if (!billingInformation) {
            throw new common_1.NotFoundException(`Billing information not found.`);
        }
        return billingInformation;
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        const { country, selected } = dto;
        return this.prisma.$transaction(async (prisma) => {
            const existing_billing_info = await this.findOne(id, auth.sub);
            let country_name;
            if (country) {
                country_name = (0, generic_utils_1.getCountryName)(country);
                if (!country_name) {
                    throw new common_1.NotFoundException(`Country code '${country}' not found`);
                }
            }
            if (selected) {
                await prisma.billingInformation.updateMany({
                    where: { user_id: auth.sub },
                    data: { selected: false },
                });
            }
            await prisma.billingInformation.update({
                where: { id: existing_billing_info.id },
                data: {
                    ...dto,
                    ...(country && { country_code: country }),
                    ...(country_name && { country: country_name }),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BILLING,
                entity: this.model,
                entity_id: existing_billing_info.id,
                metadata: `User with ID ${auth.sub} just updated their billing information of ID ${existing_billing_info.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Billing information updated successfully.',
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_billing_info = await this.findOne(id, auth.sub);
            await prisma.billingInformation.update({
                where: { id: existing_billing_info.id },
                data: {
                    address: (0, generic_utils_1.deletionRename)(existing_billing_info.address),
                    state: (0, generic_utils_1.deletionRename)(existing_billing_info.state),
                    country: (0, generic_utils_1.deletionRename)(existing_billing_info.country),
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BILLING,
                entity: this.model,
                entity_id: existing_billing_info.id,
                metadata: `User with ID ${auth.sub} just deleted their billing information of ID ${existing_billing_info.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Billing information deleted successfully.',
            };
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], BillingService);
//# sourceMappingURL=billing.service.js.map