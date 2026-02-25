import { PrismaClient, Prisma } from '@prisma/client';
export declare class PrismaBaseRepository<T, CreateInput, UpdateInput, WhereUniqueInput, WhereInput, UpsertArgs> {
    private readonly model;
    private readonly prisma;
    constructor(model: keyof Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>, prisma: PrismaClient);
    private getModelDelegate;
    findOne(uniqueFilter: WhereUniqueInput | any, include?: any, select?: any): Promise<T | null | any>;
    create(data: CreateInput): Promise<T>;
    update(uniqueFilter: WhereUniqueInput, data: UpdateInput): Promise<T>;
    delete(uniqueFilter: WhereUniqueInput): Promise<T>;
    forceDelete(uniqueFilter: WhereUniqueInput): Promise<T>;
    count(filters: WhereInput, deleted?: string): Promise<number>;
    countDistinct(filters: WhereInput, by?: any): Promise<number>;
    findManyWithPagination(filters?: WhereInput, pagination?: {
        page?: number;
        limit?: number;
    }, orderBy?: Prisma.SortOrder, include?: any, select?: any, deleted?: string): Promise<T[]>;
    findManyDistinctWithPagination(filters?: WhereInput, pagination?: {
        page?: number;
        limit?: number;
    }, orderBy?: Prisma.SortOrder, include?: any, select?: any, distinct?: any): Promise<T[]>;
    transaction<R>(operations: (prisma: PrismaClient | any) => Promise<R>): Promise<R>;
    upsert(upsertData: UpsertArgs | any): Promise<T>;
    findMany(filters?: WhereInput, orderBy?: Prisma.SortOrder, include?: any, select?: any): Promise<T[]>;
    updateMany(uniqueFilter: WhereUniqueInput | any, data: UpdateInput): Promise<T>;
    sum(field: any, filters?: WhereInput): Promise<number>;
}
