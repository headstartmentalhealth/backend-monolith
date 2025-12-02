import { PrismaClient, Prisma } from '@prisma/client';

export class PrismaBaseService<Model> {
  constructor(protected readonly prismaModel: any) {}

  async findAll(args?: Prisma.LogFindManyArgs): Promise<Model[]> {
    return this.prismaModel.findMany(args);
  }

  async findOne(
    where: Prisma.LogWhereInput,
    args?: Prisma.LogFindUniqueArgs,
  ): Promise<Model | null> {
    return this.prismaModel.findUnique({
      where,
      ...args,
    });
  }

  async create(data: Prisma.InputJsonValue): Promise<Model> {
    return this.prismaModel.create({
      data,
    });
  }

  async update(
    where: Prisma.LogWhereInput,
    data: Prisma.InputJsonValue,
  ): Promise<Model> {
    return this.prismaModel.update({
      where,
      data,
    });
  }

  async delete(where: Prisma.LogWhereInput): Promise<Model> {
    return this.prismaModel.delete({
      where,
    });
  }

  async findManyWithPagination(
    filters: Prisma.LogWhereInput,
    pagination: { page?: number; limit?: number },
    orderBy: Prisma.SortOrder = 'desc',
  ): Promise<Model[]> {
    const { page = 1, limit = 10 } = pagination;

    return this.prismaModel.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        timestamp: orderBy, // Customize field or add parameterization for other fields if needed
      },
    });
  }
}
