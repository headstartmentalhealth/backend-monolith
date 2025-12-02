import {
  AuthPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { pageFilter } from '@/generic/generic.utils';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product, ProductStatus, ProductType } from '@prisma/client';
import { FilterProductDto } from '../ticket/crud/crud.dto';
import { TZ } from '@/generic/generic.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { DEFAULT_CURRENCY } from '@/generic/generic.data';

@Injectable()
export class ProductGeneralService {
  private readonly productRepository: PrismaBaseRepository<
    Product,
    Prisma.ProductCreateInput,
    Prisma.ProductUpdateInput,
    Prisma.ProductWhereUniqueInput,
    Prisma.ProductWhereInput | Prisma.ProductFindFirstArgs,
    Prisma.ProductUpsertArgs
  >;

  private readonly select: Prisma.ProductSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    price: true,
    original_price: true,
    currency: true,
    keywords: true,
    metadata: true,
    status: true,
    type: true,
    published_at: true,
    archived_at: true,
    creator_id: true,
    created_at: true,
    business_info: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    category: true,
    multimedia: true,
    ticket: {
      select: {
        id: true,
        event_time: true,
        event_start_date: true,
        event_end_date: true,
        event_location: true,
        event_type: true,
        ticket_tiers: { where: { deleted_at: null } },
      },
    },
    subscription_plan: { include: { subscription_plan_prices: true } },
    physical_product: { include: { media: { include: { multimedia: true } } } },
    other_currencies: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly genericService: GenericService,
  ) {
    this.productRepository = new PrismaBaseRepository<
      Product,
      Prisma.ProductCreateInput,
      Prisma.ProductUpdateInput,
      Prisma.ProductWhereUniqueInput,
      Prisma.ProductWhereInput | Prisma.ProductFindFirstArgs,
      Prisma.ProductUpsertArgs
    >('product', prisma);
  }

  /**
   * Fetch products - for business
   * @param payload
   * @param filterProductDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterProductDto);

    // Build price filter
    const priceFilter: Prisma.ProductWhereInput = {};
    if (
      filterProductDto.min_price !== undefined ||
      filterProductDto.max_price !== undefined
    ) {
      priceFilter.price = {};
      if (filterProductDto.min_price !== undefined) {
        priceFilter.price.gte = filterProductDto.min_price;
      }
      if (filterProductDto.max_price !== undefined) {
        priceFilter.price.lte = filterProductDto.max_price;
      }
    }

    // Filters
    const filters: Prisma.ProductWhereInput & TZ = {
      business_id: payload['Business-Id'],
      ...(filterProductDto.status && { status: filterProductDto.status }),
      ...(filterProductDto.type && { type: filterProductDto.type }),
      ...(filterProductDto.q && {
        OR: [
          {
            title: { contains: filterProductDto.q, mode: 'insensitive' },
          },
          {
            keywords: { contains: filterProductDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...(Object.keys(priceFilter).length > 0 && priceFilter),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [products, total] = await Promise.all([
      this.productRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.productRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: products,
      count: total,
    };
  }

  /**
   * Fetch products - for admins
   * @param payload
   * @param filterProductDto
   * @returns
   */
  async fetchAll(
    payload: AuthPayload,
    filterProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    // Check if user is part of the owner's administrators  (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterProductDto);

    // Build price filter
    const priceFilter: Prisma.ProductWhereInput = {};
    if (
      filterProductDto.min_price !== undefined ||
      filterProductDto.max_price !== undefined
    ) {
      priceFilter.price = {};
      if (filterProductDto.min_price !== undefined) {
        priceFilter.price.gte = filterProductDto.min_price;
      }
      if (filterProductDto.max_price !== undefined) {
        priceFilter.price.lte = filterProductDto.max_price;
      }
    }

    // Filters
    const filters: Prisma.ProductWhereInput & TZ = {
      ...(filterProductDto.status && { status: filterProductDto.status }),
      ...(filterProductDto.business_id && {
        business_id: filterProductDto.business_id,
      }),
      ...(filterProductDto.type && { type: filterProductDto.type }),
      ...(filterProductDto.q && {
        OR: [
          {
            title: { contains: filterProductDto.q, mode: 'insensitive' },
          },
          {
            keywords: { contains: filterProductDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...(Object.keys(priceFilter).length > 0 && priceFilter),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select: Prisma.ProductSelect = {
      ...this.select,
      business_info: true,
      creator: { include: { role: true, profile: true } },
    };

    const [products, total] = await Promise.all([
      this.productRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.productRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: products,
      count: total,
    };
  }

  /**
   * Fetch products for an organization with query and product type filter
   * @param businessId - The business/organization ID
   * @param filterProductDto - Filtering and pagination DTO
   */
  async fetchOrganizationProducts(
    businessId: string,
    filterDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    const { min_price, max_price, type, q, currency } = filterDto;

    const { filters: paginationFilters, pagination_options } =
      pageFilter(filterDto);

    const baseBusinessFilter: Prisma.ProductWhereInput = {
      OR: [
        { business_id: businessId },
        { business_info: { business_slug: businessId } },
      ],
    };

    const priceFilter: Prisma.ProductWhereInput =
      min_price !== undefined || max_price !== undefined
        ? {
            price: {
              ...(min_price !== undefined && { gte: min_price }),
              ...(max_price !== undefined && { lte: max_price }),
            },
          }
        : {};

    const searchFilter: Prisma.ProductWhereInput | undefined = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { keywords: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const filters: Prisma.ProductWhereInput = {
      ...baseBusinessFilter,
      status: ProductStatus.PUBLISHED,
      ...(type && { type }),
      ...(searchFilter ?? {}),
      ...(Object.keys(priceFilter).length && priceFilter),
      ...paginationFilters,
      deleted_at: null,
    };

    let [products, total] = await Promise.all([
      this.productRepository.findManyWithPagination(
        filters,
        pagination_options,
        Prisma.SortOrder.desc,
        undefined,
        this.select,
      ),
      this.productRepository.count({ ...filters }),
    ]);

    if (currency && currency !== DEFAULT_CURRENCY) {
      products = await Promise.all(
        products.map((product) =>
          this.genericService.assignSelectedCurrencyPrices(product, currency),
        ),
      );
    }

    return {
      statusCode: HttpStatus.OK,
      data: products,
      count: total,
    };
  }

  /**
   * Fetch a product by id for public users
   * @param productId - The product ID
   */
  async fetchProductByIdPublic(
    productId: string,
    currency?: string,
  ): Promise<GenericPayloadAlias<Product | any>> {
    const product = await this.prisma.product.findFirst({
      where: {
        AND: {
          OR: [{ id: productId }, { slug: productId }],
          status: ProductStatus.PUBLISHED,
          deleted_at: null,
        },
      },
      select: {
        ...this.select,
        modules: {
          include: {
            contents: {
              select: {
                id: true,
                title: true,
                multimedia: { select: { type: true } },
              },
            },
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const formatted_product =
      await this.genericService.assignSelectedCurrencyPrices(product, currency);

    return {
      statusCode: HttpStatus.OK,
      message: 'Product details fetched',
      data: formatted_product,
    };
  }
}
