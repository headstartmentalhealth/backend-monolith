"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBaseService = void 0;
class PrismaBaseService {
    constructor(prismaModel) {
        this.prismaModel = prismaModel;
    }
    async findAll(args) {
        return this.prismaModel.findMany(args);
    }
    async findOne(where, args) {
        return this.prismaModel.findUnique({
            where,
            ...args,
        });
    }
    async create(data) {
        return this.prismaModel.create({
            data,
        });
    }
    async update(where, data) {
        return this.prismaModel.update({
            where,
            data,
        });
    }
    async delete(where) {
        return this.prismaModel.delete({
            where,
        });
    }
    async findManyWithPagination(filters, pagination, orderBy = 'desc') {
        const { page = 1, limit = 10 } = pagination;
        return this.prismaModel.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                timestamp: orderBy,
            },
        });
    }
}
exports.PrismaBaseService = PrismaBaseService;
//# sourceMappingURL=prisma.base.service.js.map