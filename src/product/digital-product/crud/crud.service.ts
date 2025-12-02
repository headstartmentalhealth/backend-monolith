import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
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
import {
  Action,
  Prisma,
  Product,
  ProductStatus,
  ProductType,
  Ticket,
  TicketTier,
} from '@prisma/client';
import { CreateDigitalProductDto, UpdateDigitalProductDto } from './crud.dto';
import { IdDto, TZ } from '@/generic/generic.dto';
import { DeleteDigitalProduct } from './crud.payload';
import { FilterProductDto } from '@/product/general/general.dto';

@Injectable()
export class DigitalProductCrudService {
  private readonly model = 'Product';
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
    keywords: true,
    metadata: true,
    status: true,
    published_at: true,
    archived_at: true,
    price: true,
    original_price: true,
    currency: true,
    multimedia_id: true,
    creator_id: true,
    category_id: true,
    created_at: true,
    updated_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    purchased_digital_products: { take: 1 },
    category: true,
    multimedia: true,
    zip_file: true,
    other_currencies: true,
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
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
   * Create a digital product
   * @param request
   * @param createDigitalProductDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createDigitalProductDto: CreateDigitalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const {
      title,
      slug,
      description,
      price,
      original_price,
      multimedia_id,
      multimedia_zip_id,
      category_id,
      keywords,
      other_currencies,
    } = createDigitalProductDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      const product_slug = await prisma.product.findFirst({ where: { slug } });
      if (product_slug) {
        throw new ConflictException('Shortlink already exists.');
      }

      // Check if multimedia exists
      const multimedia = await prisma.multimedia.findUnique({
        where: { id: multimedia_id },
      });

      if (!multimedia) {
        throw new NotFoundException('Multimedia not found.');
      }

      // Check if multimedia zip exists
      const multimedia_zip = await prisma.multimedia.findUnique({
        where: { id: multimedia_zip_id },
      });

      if (!multimedia) {
        throw new NotFoundException('Multimedia zip not found.');
      }

      // Check if product category exists
      const product_category = await prisma.productCategory.findUnique({
        where: { id: category_id },
      });

      if (!product_category) {
        throw new NotFoundException('Category not found.');
      }

      // 2. Create ticket product
      const product = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          price,
          original_price,
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
          multimedia: { connect: { id: multimedia_id } },
          zip_file: { connect: { id: multimedia_zip_id } },
          type: ProductType.DIGITAL_PRODUCT,
          category: { connect: { id: category_id } },
          keywords,
          status: ProductStatus.PUBLISHED, // Set as published by default
          published_at: new Date(), // Set published_at
          other_currencies: other_currencies
            ? (JSON.parse(
                JSON.stringify(other_currencies),
              ) as Prisma.InputJsonValue)
            : undefined,
        },
        include: { business_info: { include: { onboarding_status: true } } },
      });

      if (product.business_info.onboarding_status.current_step < 5) {
        // Update onboarding status if not updated to 5
        await prisma.onboardingStatus.upsert({
          where: {
            user_id_business_id: {
              user_id: auth.sub,
              business_id: request['Business-Id'],
            },
          },
          create: {
            user_id: auth.sub,
            business_id: request['Business-Id'],
            current_step: 5,
          },
          update: {
            current_step: 5,
          },
        });
      }

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_DIGITAL_PRODUCT,
          entity: this.model,
          entity_id: product.id,
          metadata: `User with ID ${auth.sub} just created a digital product ID ${product.id} for Business ID ${product.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Digital product created successfully.',
        data: product,
      };
    });
  }

  /**
   * Fetch digital products (products of type DIGITAL_PRODUCT)
   * @param payload
   * @param filterTicketDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterProductDto: FilterProductDto, // reuse or create FilterProductDto if needed
  ): Promise<PagePayload<Product>> {
    const auth = payload.user;

    // Ensure user is part of the business
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Apply pagination filter logic
    const pagination_filters = pageFilter(filterProductDto);

    // Construct filters
    const filters: Prisma.ProductWhereInput & TZ = {
      business_id: payload['Business-Id'],
      type: ProductType.DIGITAL_PRODUCT,
      ...(filterProductDto.status && { status: filterProductDto.status }),
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
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    const select: Prisma.ProductSelect = {
      ...this.select,
      business_info: true,
    };

    const [digital_assets, total] = await Promise.all([
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
      data: digital_assets,
      count: total,
    };
  }

  /**
   * Fetch single digital product
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<Product>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    const select: Prisma.ProductSelect = {
      ...this.select,
      business_info: true,
      creator: true,
    };

    const filters: Prisma.ProductWhereUniqueInput = {
      id: param.id,
      type: ProductType.DIGITAL_PRODUCT,
    };

    const product: Product = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    return {
      statusCode: HttpStatus.OK,
      data: product,
    };
  }

  /**
   * Get a single digital product (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<Product> {
    const select = this.select;

    const filters: Prisma.ProductWhereUniqueInput = {
      id,
      type: ProductType.DIGITAL_PRODUCT,
    };

    const product = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!product) {
      throw new NotFoundException(`Product not found.`);
    }

    return product;
  }

  /**
   * Update a digital product
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    dto: UpdateDigitalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const { id } = param;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      const existing_digital_product = await this.findOne(id);

      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: businessId,
      });

      const productUpdateData: Prisma.ProductUpdateInput = {
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.price && { price: dto.price }),
        ...(dto.original_price && { original_price: dto.original_price }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.keywords !== undefined && { keywords: dto.keywords }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        ...(dto.status && { status: dto.status }),
        ...(dto.category_id && {
          category: { connect: { id: dto.category_id } },
        }),
        ...(dto.multimedia_id && {
          multimedia: { connect: { id: dto.multimedia_id } },
        }),
        ...(dto.multimedia_zip_id && {
          zip_file: { connect: { id: dto.multimedia_zip_id } },
        }),
        ...(dto.status === ProductStatus.PUBLISHED && {
          published_at: new Date(),
        }),
        ...(dto.other_currencies && {
          other_currencies: dto.other_currencies
            ? (JSON.parse(
                JSON.stringify(dto.other_currencies),
              ) as Prisma.InputJsonValue)
            : undefined,
        }),
      };

      const [updatedProduct] = await Promise.all([
        prisma.product.update({
          where: { id },
          data: productUpdateData,
          include: { business_info: { include: { onboarding_status: true } } },
        }),
      ]);

      // If this is the first time publishing this ticket, check if it's the first published ticket

      if (updatedProduct.business_info.onboarding_status.current_step < 5) {
        // If this is the first published ticket, update onboarding status
        await prisma.onboardingStatus.upsert({
          where: {
            user_id_business_id: {
              user_id: auth.sub,
              business_id: businessId,
            },
          },
          create: {
            user_id: auth.sub,
            business_id: businessId,
            current_step: 5,
          },
          update: {
            current_step: 5,
          },
        });
      }

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_DIGITAL_PRODUCT,
          entity: 'Product',
          entity_id: updatedProduct.id,
          metadata: `User with ID ${auth.sub} bulk updated digital product ID ${updatedProduct.id} for business ID ${businessId}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      const finalDigitalProduct = Object.assign({}, updatedProduct);

      return {
        statusCode: HttpStatus.OK,
        message: 'Digital product updated successfully.',
        data: finalDigitalProduct,
      };
    });
  }

  /**
   * Delete a digital product
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayloadAlias<DeleteDigitalProduct>> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single digital product
      const existing_digital_product = await this.findOne(id);

      // 3. Check if digital product is published
      if (existing_digital_product.status === ProductStatus.PUBLISHED) {
        throw new ForbiddenException(
          'You cannot delete a published digital product.',
        );
      }

      // 4. Validate that there are no related models
      await this.hasRelatedRecords(existing_digital_product.id);

      // 5. Update product
      const product = await prisma.product.update({
        where: { id: existing_digital_product.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_DIGITAL_PRODUCT,
          entity: 'DigitalProduct',
          entity_id: existing_digital_product.id,
          metadata: `User with ID ${auth.sub} just deleted a digital product ID ${existing_digital_product.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Digital product deleted successfully.',
        data: {
          id: product.id,
          deleted: true,
        },
      };
    });
  }

  /**
   * Validate that model has related records
   * @param product_id
   */
  private async hasRelatedRecords(product_id: string): Promise<void> {
    const relatedTables = [{ model: this.prisma.payment, field: 'product_id' }];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: {
          purchase: {
            path: ['items'],
            array_contains: [{ product_id: product_id }],
          },
        },
      });

      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }
}
