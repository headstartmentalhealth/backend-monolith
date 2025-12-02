import { PrismaClient, Prisma } from '@prisma/client';

export class PrismaBaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
  WhereInput,
  UpsertArgs,
> {
  constructor(
    private readonly model: keyof Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    private readonly prisma: PrismaClient,
  ) {}

  private getModelDelegate() {
    return this.prisma[this.model] as any;
  }

  /**
   * Find one record by unique identifier
   */
  async findOne(
    uniqueFilter: WhereUniqueInput | any,
    include?: any,
    select?: any,
  ): Promise<T | null | any> {
    return this.getModelDelegate().findFirst({
      where: { ...uniqueFilter, deleted_at: null },
      include: include,
      select: select,
    });
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    return this.getModelDelegate().create({
      data,
    });
  }

  /**
   * Update a record
   */
  async update(uniqueFilter: WhereUniqueInput, data: UpdateInput): Promise<T> {
    return this.getModelDelegate().update({
      where: { ...uniqueFilter, deleted_at: null },
      data,
    });
  }

  /**
   * Delete a record
   */
  async delete(uniqueFilter: WhereUniqueInput): Promise<T> {
    return this.getModelDelegate().update({
      where: { ...uniqueFilter, deleted_at: null },
      data: {
        deleted_at: new Date(), // Set the current date and time
      },
    });
  }

  /**
   * Delete a record permanently
   */
  async forceDelete(uniqueFilter: WhereUniqueInput): Promise<T> {
    return this.getModelDelegate().delete({
      where: { ...uniqueFilter },
    });
  }

  /**
   * Count records with optional filters
   */
  async count(filters: WhereInput, deleted?: string): Promise<number> {
    return this.getModelDelegate().count({
      where: {
        ...filters,
        deleted_at: deleted === 'true' ? { not: null } : null,
      },
    });
  }

  /**
   * Count records with optional filters
   */
  async countDistinct(filters: WhereInput, by?: any): Promise<number> {
    const result = await this.getModelDelegate().groupBy({
      by,
      where: { ...filters, deleted_at: null },
    });

    return result.length;
  }

  async findManyWithPagination(
    filters?: WhereInput,
    pagination?: { page?: number; limit?: number },
    orderBy: Prisma.SortOrder = 'desc',
    include?: any,
    select?: any,
    deleted?: string,
  ): Promise<T[]> {
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
        created_at: orderBy, // Customize field or add parameterization for other fields if needed
      },
    });
  }

  async findManyDistinctWithPagination(
    filters?: WhereInput,
    pagination?: { page?: number; limit?: number },
    orderBy: Prisma.SortOrder = 'desc',
    include?: any,
    select?: any,
    distinct?: any,
  ): Promise<T[]> {
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
      distinct: distinct, // Ensures each customer appears only once
      orderBy: {
        created_at: orderBy, // Customize field or add parameterization for other fields if needed
      },
    });
  }

  /**
   * Execute multiple operations atomically using a transaction.
   * @param operations Callback containing Prisma operations to be executed within the transaction.
   * @returns The result of the transaction.
   */
  async transaction<R>(
    operations: (prisma: PrismaClient | any) => Promise<R>,
  ): Promise<R> {
    return this.prisma.$transaction(async (prisma) => {
      return operations(prisma);
    });
  }

  async upsert(upsertData: UpsertArgs | any): Promise<T> {
    return this.getModelDelegate().upsert({
      where: { ...upsertData.where, deleted_at: null },
      create: upsertData.create,
      update: upsertData.update,
    });
  }

  async findMany(
    filters?: WhereInput,
    orderBy: Prisma.SortOrder = 'desc',
    include?: any,
    select?: any,
  ): Promise<T[]> {
    return this.getModelDelegate().findMany({
      where: {
        ...filters,
        deleted_at: null,
      },
      select: select,
      include: include,
      orderBy: {
        created_at: orderBy, // Customize field or add parameterization for other fields if needed
      },
    });
  }

  async updateMany(
    uniqueFilter: WhereUniqueInput | any,
    data: UpdateInput,
  ): Promise<T> {
    return this.getModelDelegate().updateMany({
      where: { ...uniqueFilter, deleted_at: null },
      data,
    });
  }

  /**
   * Sum a numeric field for a given model
   * @param field - The name of the field to sum
   * @param filters - Optional where filters
   * @returns Total sum of the field
   */
  async sum(field: any, filters?: WhereInput): Promise<number> {
    const result = await this.getModelDelegate().aggregate({
      _sum: {
        [field]: true,
      },
      where: filters,
    });

    return result._sum[field] ?? 0;
  }
}
