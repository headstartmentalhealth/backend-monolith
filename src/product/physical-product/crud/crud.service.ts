import {
  AuthPayload,
  GenericDataPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Action,
  PhysicalProduct,
  Prisma,
  Product,
  ProductStatus,
  ProductType,
} from '@prisma/client';
import {
  AddPhysicalProductMedia,
  CreatePhysicalProductDto,
  ProductDto,
  UpdatePhysicalProductDto,
} from './crud.dto';
import {
  createProductIdentifiers,
  deletionRename,
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { FilterProductDto } from '@/product/general/general.dto';
import { IdDto, TZ } from '@/generic/generic.dto';
import { DeletePhysicalProduct } from './crud.payload';

@Injectable()
export class PhysicalProductCrudService {
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
    physical_product: { include: { media: { include: { multimedia: true } } } },
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
   * Create a physical product
   * @param request
   * @param createPhysicalProductDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createPhysicalProductDto: CreatePhysicalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const {
      title,
      slug,
      description,
      price,
      original_price,
      multimedia_id,
      category_id,
      keywords,
      other_currencies,
      status,
      details,
    } = createPhysicalProductDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      const business_details = await prisma.businessInformation.findUnique({
        where: { id: request['Business-Id'] },
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

      // Check if product category exists
      const product_category = await prisma.productCategory.findUnique({
        where: { id: category_id },
      });

      if (!product_category) {
        throw new NotFoundException('Category not found.');
      }

      const sku_details = createProductIdentifiers(
        business_details.business_name,
        title,
      );

      // 2. Create product
      const product = await prisma.product.create({
        data: {
          title,
          sku: sku_details.sku,
          slug,
          description,
          price,
          original_price,
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
          multimedia: { connect: { id: multimedia_id } },
          type: ProductType.PHYSICAL_PRODUCT,
          category: { connect: { id: category_id } },
          keywords,
          status, // Set as published by default
          published_at: new Date(), // Set published_at
          other_currencies: other_currencies
            ? (JSON.parse(
                JSON.stringify(other_currencies),
              ) as Prisma.InputJsonValue)
            : undefined,
        },
        include: { business_info: { include: { onboarding_status: true } } },
      });

      // 2b. Create physical product
      const physical_product = await prisma.physicalProduct.create({
        data: {
          product_id: product.id,
          sizes: details.sizes,
          colors: details.colors,
          location: details.location,
          stock: details.stock,
          type: details.type,
          gender: details.gender,
          estimated_production_time: details.estimated_production_time,
          min_required: details.min_required,
        },
      });

      // 2c. Create physical product media
      if (Boolean(details?.multimedia_ids?.length)) {
        await prisma.physicalProductMedia.createMany({
          data: details.multimedia_ids.map((multimedia_id) => ({
            multimedia_id,
            physical_product_id: physical_product.id,
          })),
        });
      }

      // 2d. Fetch physical product media
      const physical_product_media = await prisma.physicalProductMedia.findMany(
        {
          where: { physical_product_id: physical_product.id },
        },
      );

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PHYSICAL_PRODUCT,
          entity: this.model,
          entity_id: product.id,
          metadata: `User with ID ${auth.sub} just created a physical product ID ${product.id} for Business ID ${product.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Physical product created successfully.',
        data: Object.assign({}, product, {
          physical_product,
          media: physical_product_media,
        }),
      };
    });
  }

  /**
   * Fetch physical products (products of type PHYSICAL_PRODUCT)
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
      type: ProductType.PHYSICAL_PRODUCT,
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
   * Fetch single physical product
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
      creator: { select: { id: true, name: true } },
    };

    const filters: Prisma.ProductWhereUniqueInput = {
      id: param.id,
      type: ProductType.PHYSICAL_PRODUCT,
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
   * Get a single physical product (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string) {
    const select = this.select;

    const filters: Prisma.ProductWhereUniqueInput = {
      id,
      type: ProductType.PHYSICAL_PRODUCT,
    };

    const product: Product & { physical_product: PhysicalProduct } =
      await this.prisma.product.findFirst({ where: filters, select });

    if (!product) {
      throw new NotFoundException(`Product not found.`);
    }

    return product;
  }

  /**
   * Update a physical product
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    dto: UpdatePhysicalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const { id } = param;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      const existing_physical_product = await this.findOne(id);

      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: businessId,
      });

      // ✅ Always start with an empty object
      const productUpdateData: Prisma.ProductUpdateInput = {};
      const physicalProductUpdateData: Prisma.PhysicalProductUpdateInput = {};

      // ✅ Populate product update data
      if (dto) {
        if (dto.title) productUpdateData.title = dto.title;
        if (dto.slug) productUpdateData.slug = dto.slug;
        if (dto.price) productUpdateData.price = dto.price;
        if (dto.original_price)
          productUpdateData.original_price = dto.original_price;
        if (dto.description !== undefined)
          productUpdateData.description = dto.description;
        if (dto.keywords !== undefined)
          productUpdateData.keywords = dto.keywords;
        if (dto.metadata !== undefined)
          productUpdateData.metadata = dto.metadata;
        if (dto.status) productUpdateData.status = dto.status;
        if (dto.category_id)
          productUpdateData.category = { connect: { id: dto.category_id } };
        if (dto.multimedia_id)
          productUpdateData.multimedia = { connect: { id: dto.multimedia_id } };

        if (dto.status === ProductStatus.PUBLISHED)
          productUpdateData.published_at = new Date();

        if (dto.other_currencies) {
          productUpdateData.other_currencies = JSON.parse(
            JSON.stringify(dto.other_currencies),
          ) as Prisma.InputJsonValue;
        }
      }

      // ✅ Populate physical product update data
      if (dto?.details) {
        const details = dto.details;
        if (details.colors) physicalProductUpdateData.colors = details.colors;
        if (details.sizes) physicalProductUpdateData.sizes = details.sizes;
        if (details.location)
          physicalProductUpdateData.location = details.location;
        if (details.stock) physicalProductUpdateData.stock = details.stock;
        if (details.type) physicalProductUpdateData.type = details.type;
        if (details.gender) physicalProductUpdateData.gender = details.gender;
        if (details.estimated_production_time)
          physicalProductUpdateData.estimated_production_time =
            details.estimated_production_time;
        if (details.min_required)
          physicalProductUpdateData.min_required = details.min_required;
      }

      // ✅ Run updates only if there’s something to update
      const [updatedProduct, updatedPhysicalProduct] = await Promise.all([
        Object.keys(productUpdateData).length > 0
          ? prisma.product.update({
              where: { id },
              data: productUpdateData,
              include: {
                business_info: { include: { onboarding_status: true } },
              },
            })
          : this.findOne(id), // fallback — no product changes

        Object.keys(physicalProductUpdateData).length > 0
          ? prisma.physicalProduct.update({
              where: { id: existing_physical_product.physical_product.id },
              data: physicalProductUpdateData,
            })
          : existing_physical_product.physical_product, // fallback — no physical updates
      ]);

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PHYSICAL_PRODUCT,
          entity: 'PhysicalProduct',
          entity_id: updatedProduct.id,
          metadata: `User with ID ${auth.sub} bulk updated physical product ID ${updatedProduct.id} for business ID ${businessId}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Physical product updated successfully.',
        data: Object.assign({}, updatedProduct, {
          physical_product: updatedPhysicalProduct,
        }),
      };
    });
  }

  /**
   * Delete a physical product
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayloadAlias<DeletePhysicalProduct>> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single physical product
      const existing_physical_product = await this.findOne(id);

      // 3. Check if physical product is published
      if (existing_physical_product.status === ProductStatus.PUBLISHED) {
        throw new ForbiddenException(
          'You cannot delete a published physical product.',
        );
      }

      // 4. Validate that there are no related models
      await this.hasRelatedRecords(existing_physical_product.id);

      // 5. Update product
      const product = await prisma.product.update({
        where: { id: existing_physical_product.id },
        data: {
          deleted_at: new Date(),
          title: deletionRename(existing_physical_product.title),
          slug: deletionRename(existing_physical_product.slug),
        },
      });

      // 5b. Update physical product
      await prisma.physicalProduct.update({
        where: { id: existing_physical_product.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 5c. Remove physical product contents
      await prisma.physicalProductMedia.deleteMany({
        where: { physical_product: { product_id: product.id } },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_PHYSICAL_PRODUCT,
          entity: 'PhysicalProduct',
          entity_id: existing_physical_product.id,
          metadata: `User with ID ${auth.sub} just deleted a physical product ID ${existing_physical_product.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Physical product deleted successfully.',
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

  /**
   * Remove single physical product media
   * @param request
   * @param paramDto
   * @returns
   */
  async removeSinglePhysicalProductMedia(
    request: AuthPayload & Request,
    paramDto: IdDto,
  ) {
    // Check if physical product media exists
    const physicalProductMedia =
      await this.prisma.physicalProductMedia.findUnique({
        where: { id: paramDto.id },
      });

    if (!physicalProductMedia) {
      throw new NotFoundException('Physical product media not found.');
    }

    // Delete all linked media
    await this.prisma.physicalProductMedia.delete({
      where: { id: paramDto.id },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Physical product media content removed successfully.',
    };
  }

  /**
   * Add physical product media content
   * @param product_id
   * @param multimedia_ids
   * @returns
   */
  async addPhysicalProductMedia(
    request: AuthPayload & Request,
    productDto: ProductDto,
    addPhysicalProductMedia: AddPhysicalProductMedia,
  ) {
    const { multimedia_ids } = addPhysicalProductMedia;
    const { product_id } = productDto;

    // 1️⃣ Validate input
    if (!Array.isArray(multimedia_ids) || multimedia_ids.length === 0) {
      throw new BadRequestException('At least one multimedia ID is required.');
    }

    // 2️⃣ Check if physical product exists
    const physicalProduct = await this.prisma.physicalProduct.findUnique({
      where: { product_id },
    });

    if (!physicalProduct) {
      throw new NotFoundException('Physical product not found.');
    }

    // 3️⃣ Validate all multimedia exist
    const existingMedia = await this.prisma.multimedia.findMany({
      where: { id: { in: multimedia_ids } },
      select: { id: true },
    });

    const existingIds = existingMedia.map((m) => m.id);
    const missing = multimedia_ids.filter((id) => !existingIds.includes(id));

    if (missing.length > 0) {
      throw new NotFoundException(
        `Some multimedia not found: ${missing.join(', ')}`,
      );
    }

    // 4️⃣ Prevent duplicate associations
    const alreadyLinked = await this.prisma.physicalProductMedia.findMany({
      where: {
        physical_product_id: physicalProduct.id,
        multimedia_id: { in: multimedia_ids },
      },
      select: { multimedia_id: true },
    });

    const alreadyLinkedIds = alreadyLinked.map((m) => m.multimedia_id);
    const newIdsToAdd = multimedia_ids.filter(
      (id) => !alreadyLinkedIds.includes(id),
    );

    if (newIdsToAdd.length === 0) {
      return {
        statusCode: HttpStatus.OK,
        message: 'All provided images are already linked to this product.',
        data: alreadyLinked,
      };
    }

    // 5️⃣ Add new image links
    await this.prisma.physicalProductMedia.createMany({
      data: newIdsToAdd.map((multimedia_id) => ({
        multimedia_id,
        physical_product_id: physicalProduct.id,
      })),
    });

    // 6️⃣ Fetch all current media (existing + newly added)
    const allMedia = await this.prisma.physicalProductMedia.findMany({
      where: { physical_product_id: physicalProduct.id },
      include: { multimedia: true }, // optional: include full media details
    });

    // 7️⃣ Log action
    await this.logService.createWithTrx(
      {
        user_id: request.user.sub,
        action: Action.MANAGE_PHYSICAL_PRODUCT,
        entity: 'PhysicalProductMedia',
        entity_id: physicalProduct.id,
        metadata: `Added ${newIdsToAdd.length} new image(s) to physical product ${physicalProduct.id}`,
        ip_address: getIpAddress(request),
        user_agent: getUserAgent(request),
      },
      this.prisma.log,
    );

    // ✅ Final response
    return {
      statusCode: HttpStatus.CREATED,
      message: `Added ${newIdsToAdd.length} new image(s) successfully.`,
      data: allMedia,
    };
  }
}
