import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, Prisma, PrismaClient, ProductCategory } from '@prisma/client';
import {
  CreateProductCategoryDto,
  FilterProductCategoryDto,
} from './category.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import {
  deletionRename,
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, TZ } from '@/generic/generic.dto';

@Injectable()
export class ProductCategoryService {
  private readonly model = 'ProductCategory';
  private readonly productCategoryRepository: PrismaBaseRepository<
    ProductCategory,
    Prisma.ProductCategoryCreateInput,
    Prisma.ProductCategoryUpdateInput,
    Prisma.ProductCategoryWhereUniqueInput,
    Prisma.ProductCategoryWhereInput | Prisma.ProductCategoryFindFirstArgs,
    Prisma.ProductCategoryUpsertArgs
  >;
  private readonly select: Prisma.ProductCategorySelect = {
    id: true,
    name: true,
    creator_id: true,
    created_at: true,
    updated_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.productCategoryRepository = new PrismaBaseRepository<
      ProductCategory,
      Prisma.ProductCategoryCreateInput,
      Prisma.ProductCategoryUpdateInput,
      Prisma.ProductCategoryWhereUniqueInput,
      Prisma.ProductCategoryWhereInput | Prisma.ProductCategoryFindFirstArgs,
      Prisma.ProductCategoryUpsertArgs
    >('productCategory', prisma);
  }

  /**
   * Check if Product category name exists (Return error if true)
   * @param name
   * @param business_id
   * @param prisma
   */
  async nameExists(
    name: string,
    business_id: string,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    // Find product category by name
    const product_category = await prisma.productCategory.findUnique({
      where: { name },
    });

    // Check if name already exist
    if (product_category) {
      throw new ConflictException('Product category name exists.');
    }
  }

  /**
   * Create product category
   * @param request
   * @param createCategoryDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createCategoryDto: CreateProductCategoryDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { name } = createCategoryDto;

    return this.prisma.$transaction(async (prisma) => {
      // 2. Name exists
      await this.nameExists(name, request['Business-Id'], prisma);

      // 3. Create product category
      const product_category = await prisma.productCategory.create({
        data: {
          name,
          creator: { connect: { id: auth.sub } },
        },
      });

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PRODUCT_CATEGORY,
          entity: this.model,
          entity_id: product_category.id,
          metadata: `User with ID ${auth.sub} just created a ticket category ID ${product_category.id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product category created successfully.',
      };
    });
  }

  /**
   * Fetch product categories
   * @param payload
   * @param filterProductCategoryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterProductCategoryDto: FilterProductCategoryDto,
  ): Promise<PagePayload<ProductCategory>> {
    const auth = payload.user;

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterProductCategoryDto);

    // Filters
    const filters: Prisma.ProductCategoryWhereInput & TZ = {
      ...(filterProductCategoryDto.q && {
        name: { contains: filterProductCategoryDto.q, mode: 'insensitive' },
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [productCategories, total] = await Promise.all([
      this.productCategoryRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.productCategoryRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: productCategories,
      count: total,
    };
  }

  /**
   * Fetch single product category
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<ProductCategory>> {
    const auth = payload.user;

    const select: Prisma.ProductCategorySelect = {
      ...this.select,
    };

    const filters: Prisma.ProductCategoryWhereUniqueInput = {
      id: param.id,
    };

    const productCategory: ProductCategory =
      await this.productCategoryRepository.findOne(filters, undefined, select);

    return {
      statusCode: HttpStatus.OK,
      data: productCategory,
    };
  }

  /**
   * Get a single product category (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<ProductCategory> {
    const select = this.select;

    const filters: Prisma.ProductCategoryWhereUniqueInput = {
      id,
    };

    const product_category = await this.productCategoryRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!product_category) {
      throw new NotFoundException(`Product category not found.`);
    }

    return product_category;
  }

  /**
   * Update product category
   * @param request
   * @param param
   * @param updateProductCategoryDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    updateProductCategoryDto: Partial<CreateProductCategoryDto>,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    const { name } = updateProductCategoryDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get a single product category
      const existing_product_category = await this.findOne(id);

      // 3. Update product category
      await prisma.productCategory.update({
        where: { id },
        data: {
          ...updateProductCategoryDto,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PRODUCT_CATEGORY,
          entity: this.model,
          entity_id: existing_product_category.id,
          metadata: `User with ID ${auth.sub} just updated a product category ID ${existing_product_category.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Product category updated successfully.',
      };
    });
  }

  /**
   * Delete product category
   * @param request
   * @param param
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 2. Get a single product category
      const existing_product_category = await this.findOne(id);

      // 4. Validate that there are no related models - TODO

      // 5. Soft delete product category
      await prisma.productCategory.update({
        where: { id: existing_product_category.id },
        data: {
          name: deletionRename(existing_product_category.name),
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PRODUCT_CATEGORY,
          entity: this.model,
          entity_id: existing_product_category.id,
          metadata: `User with ID ${auth.sub} just deleted a product category ID ${existing_product_category.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Product category deleted successfully.',
      };
    });
  }

  /**
   * Validate that model has related records
   * @param product_category_id
   */
  private async hasRelatedRecords(product_category_id: string): Promise<void> {
    // Provide model - TODO
    const relatedTables = [{ model: null, field: 'product_category_id' }];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field]: product_category_id },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }
}
