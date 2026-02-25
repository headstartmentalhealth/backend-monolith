import { Prisma } from '@prisma/client';
export declare class PrismaBaseService<Model> {
    protected readonly prismaModel: any;
    constructor(prismaModel: any);
    findAll(args?: Prisma.LogFindManyArgs): Promise<Model[]>;
    findOne(where: Prisma.LogWhereInput, args?: Prisma.LogFindUniqueArgs): Promise<Model | null>;
    create(data: Prisma.InputJsonValue): Promise<Model>;
    update(where: Prisma.LogWhereInput, data: Prisma.InputJsonValue): Promise<Model>;
    delete(where: Prisma.LogWhereInput): Promise<Model>;
    findManyWithPagination(filters: Prisma.LogWhereInput, pagination: {
        page?: number;
        limit?: number;
    }, orderBy?: Prisma.SortOrder): Promise<Model[]>;
}
