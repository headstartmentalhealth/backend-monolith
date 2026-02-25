"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBaseRepository = void 0;
class PrismaBaseRepository {
    constructor(model, prisma) {
        this.model = model;
        this.prisma = prisma;
    }
    getModelDelegate() {
        return this.prisma[this.model];
    }
    async findOne(uniqueFilter, include, select) {
        return this.getModelDelegate().findFirst({
            where: { ...uniqueFilter, deleted_at: null },
            include: include,
            select: select,
        });
    }
    async create(data) {
        return this.getModelDelegate().create({
            data,
        });
    }
    async update(uniqueFilter, data) {
        return this.getModelDelegate().update({
            where: { ...uniqueFilter, deleted_at: null },
            data,
        });
    }
    async delete(uniqueFilter) {
        return this.getModelDelegate().update({
            where: { ...uniqueFilter, deleted_at: null },
            data: {
                deleted_at: new Date(),
            },
        });
    }
    async forceDelete(uniqueFilter) {
        return this.getModelDelegate().delete({
            where: { ...uniqueFilter },
        });
    }
    async count(filters, deleted) {
        return this.getModelDelegate().count({
            where: {
                ...filters,
                deleted_at: deleted === 'true' ? { not: null } : null,
            },
        });
    }
    async countDistinct(filters, by) {
        const result = await this.getModelDelegate().groupBy({
            by,
            where: { ...filters, deleted_at: null },
        });
        return result.length;
    }
    async findManyWithPagination(filters, pagination, orderBy = 'desc', include, select, deleted) {
        const { page = 1, limit = 20 } = pagination;
        return this.getModelDelegate().findMany({
            where: {
                ...filters,
                deleted_at: deleted === 'true' ? { not: null } : null,
            },
            select: select,
            include: include,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                created_at: orderBy,
            },
        });
    }
    async findManyDistinctWithPagination(filters, pagination, orderBy = 'desc', include, select, distinct) {
        const { page = 1, limit = 20 } = pagination;
        return this.getModelDelegate().findMany({
            where: {
                ...filters,
                deleted_at: null,
            },
            select: select,
            include: include,
            skip: (page - 1) * limit,
            take: limit,
            distinct: distinct,
            orderBy: {
                created_at: orderBy,
            },
        });
    }
    async transaction(operations) {
        return this.prisma.$transaction(async (prisma) => {
            return operations(prisma);
        });
    }
    async upsert(upsertData) {
        return this.getModelDelegate().upsert({
            where: { ...upsertData.where, deleted_at: null },
            create: upsertData.create,
            update: upsertData.update,
        });
    }
    async findMany(filters, orderBy = 'desc', include, select) {
        return this.getModelDelegate().findMany({
            where: {
                ...filters,
                deleted_at: null,
            },
            select: select,
            include: include,
            orderBy: {
                created_at: orderBy,
            },
        });
    }
    async updateMany(uniqueFilter, data) {
        return this.getModelDelegate().updateMany({
            where: { ...uniqueFilter, deleted_at: null },
            data,
        });
    }
    async sum(field, filters) {
        const result = await this.getModelDelegate().aggregate({
            _sum: {
                [field]: true,
            },
            where: filters,
        });
        return result._sum[field] ?? 0;
    }
}
exports.PrismaBaseRepository = PrismaBaseRepository;
//# sourceMappingURL=prisma.base.repository.js.map