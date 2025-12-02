import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCourseDto,
  FilterCourseDto,
  UpdateCourseDto,
  BulkCreateCourseDto,
} from './crud.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import {
  Action,
  Course,
  CourseStatus,
  Prisma,
  Product,
  ProductType,
  ProductStatus,
  MultimediaType,
  MultimediaProvider,
} from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, QueryDto, TZ } from '@/generic/generic.dto';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import * as streamifier from 'streamifier';

@Injectable()
export class CourseCrudService {
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
    price: true,
    original_price: true,
    currency: true,
    keywords: true,
    metadata: true,
    status: true,
    readiness_percent: true,
    published_at: true,
    archived_at: true,
    creator_id: true,
    created_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    multimedia: true,
    category: true,
    other_currencies: true,
  };

  constructor(
    private readonly prisma: PrismaService,
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
   * Create a course product
   * @param request
   * @param dto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createCourseDto: CreateCourseDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const {
      title,
      slug,
      description,
      multimedia_id,
      price,
      category_id,
      other_currencies,
    } = createCourseDto;

    return this.prisma.$transaction(async (prisma) => {
      // 🔹 Validate other_currencies with the helper
      await this.genericService.validateOtherCurrencies(
        other_currencies,
        prisma,
      );

      const product_slug = await prisma.product.findFirst({ where: { slug } });
      if (product_slug) {
        throw new ConflictException('Shortlink already exists.');
      }

      // Fetch business onboarding status
      const onboarding_status = await prisma.onboardingStatus.findFirst({
        where: { business_id: request['Business-Id'] },
      });

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

      // Validate slug
      const product_slug_details = await prisma.product.findFirst({
        where: { slug },
      });

      if (product_slug_details) {
        throw new BadRequestException(`This slug ${slug} is not available.`);
      }

      // 2. Create course product
      const course = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
          multimedia: { connect: { id: multimedia_id } },
          price,
          type: ProductType.COURSE,
          category: { connect: { id: category_id } },
          readiness_percent: 15, // For creating the course record
          other_currencies: other_currencies
            ? (JSON.parse(
                JSON.stringify(other_currencies),
              ) as Prisma.InputJsonValue)
            : undefined,
        },
      });

      // 3. If this is the first time publishing a course, update onboarding status to step 5
      if (onboarding_status.current_step < 5) {
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

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE,
          entity: 'Course',
          entity_id: course.id,
          metadata: `User with ID ${auth.sub} just created a course product ID ${course.id} for Business ID ${course.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Course created successfully.',
        data: course,
      };
    });
  }

  /**
   * Fetch courses (products)
   * @param payload
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterCourseDto: FilterCourseDto,
  ): Promise<PagePayload<Product>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterCourseDto);

    // Filters
    const filters: Prisma.ProductWhereInput & TZ = {
      business_id: payload['Business-Id'],
      type: ProductType.COURSE,
      ...(filterCourseDto.status && { status: filterCourseDto.status }),
      ...(filterCourseDto.q && {
        OR: [
          {
            title: { contains: filterCourseDto.q, mode: 'insensitive' },
          },
          {
            keywords: { contains: filterCourseDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [courses, total] = await Promise.all([
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
      data: courses,
      count: total,
    };
  }

  /**
   * Fetch single course
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
      // business_info: true, not needed
      creator: true,
      // modules: true,
    };

    const filters: Prisma.ProductWhereUniqueInput = {
      id: param.id,
    };

    const course: Product = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    return {
      statusCode: HttpStatus.OK,
      data: course,
    };
  }

  /**
   * Get a single course (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<Course> {
    const select = this.select;

    const filters: Prisma.ProductWhereUniqueInput = {
      id,
    };

    const course = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!course) {
      throw new NotFoundException(`Course not found.`);
    }

    return course;
  }

  /**
   * Update a course
   * @param request
   * @param param
   * @param updateCourseDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get a single course
      const existing_course = await this.findOne(id);

      // 🔹 Validate other_currencies with the helper
      await this.genericService.validateOtherCurrencies(
        updateCourseDto.other_currencies,
        prisma,
      );

      // 2. Update course
      const response = await prisma.product.update({
        where: { id },
        data: {
          ...updateCourseDto,
          ...(updateCourseDto.status &&
            updateCourseDto.status === CourseStatus.PUBLISHED && {
              published_at: new Date(),
            }),
          ...(updateCourseDto.other_currencies && {
            other_currencies: updateCourseDto.other_currencies
              ? (JSON.parse(
                  JSON.stringify(updateCourseDto.other_currencies),
                ) as Prisma.InputJsonValue)
              : undefined,
          }),
        },
      });

      // 3. If this is the first time publishing a course, update onboarding status to step 5
      if (
        updateCourseDto.status === CourseStatus.PUBLISHED &&
        !existing_course.published_at
      ) {
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

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE,
          entity: 'Course',
          entity_id: existing_course.id,
          metadata: `User with ID ${auth.sub} just updated a course ID ${existing_course.id} for business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Course updated successfully.',
        data: response,
      };
    });
  }

  /**
   * Delete a course
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single course
      const existing_course = await this.findOne(id);

      // 3. Check if course is published
      if (existing_course.published_at) {
        throw new ForbiddenException('You cannot delete a published course.');
      }

      // 4. Validate that there are no related models
      await this.hasRelatedRecords(existing_course.id);

      // 5. Update subscription plan
      await prisma.product.update({
        where: { id: existing_course.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE,
          entity: 'Course',
          entity_id: existing_course.id,
          metadata: `User with ID ${auth.sub} just deleted a course ID ${existing_course.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Course deleted successfully.',
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
   * Find the closest matching category by name
   * @param prisma
   * @param categoryName
   * @returns
   */
  private async findClosestCategory(
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    categoryName: string,
  ): Promise<string> {
    // Get all categories
    const categories = await prisma.productCategory.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (categories.length === 0) {
      throw new NotFoundException('No categories found in the system.');
    }

    // Convert both strings to lowercase for comparison
    const searchName = categoryName.toLowerCase();

    // Find exact match first
    const exactMatch = categories.find(
      (cat) => cat.name.toLowerCase() === searchName,
    );
    if (exactMatch) {
      return exactMatch.id;
    }

    // Find partial match
    const partialMatch = categories.find(
      (cat) =>
        cat.name.toLowerCase().includes(searchName) ||
        searchName.includes(cat.name.toLowerCase()),
    );
    if (partialMatch) {
      return partialMatch.id;
    }

    // If no match found, use the first category as default
    return categories[0].id;
  }

  /**
   * Download file from URL and upload to Cloudinary
   * @param url
   * @returns
   */
  private async uploadUrlToCloudinary(url: string): Promise<string> {
    try {
      // Download file
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        );

        streamifier.createReadStream(buffer).pipe(upload);
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to process multimedia URL: ${error.message}`,
      );
    }
  }

  /**
   * Create multimedia record
   * @param prisma
   * @param request
   * @param url
   * @returns
   */
  private async createMultimediaRecord(
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    request: AuthPayload & Request,
    url: string,
  ): Promise<string> {
    const multimedia = await prisma.multimedia.create({
      data: {
        url,
        type: MultimediaType.IMAGE,
        provider: MultimediaProvider.CLOUDINARY,
        creator: { connect: { id: request.user.sub } },
        business_info: { connect: { id: request['Business-Id'] } },
      },
    });

    return multimedia.id;
  }

  /**
   * Bulk create courses
   * @param request
   * @param dto
   * @returns
   */
  async bulkCreate(
    request: AuthPayload & Request,
    dto: BulkCreateCourseDto,
  ): Promise<GenericPayloadAlias<Product[]>> {
    const auth = request.user;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: businessId,
      });

      const createdCourses: Product[] = [];
      let isFirstPublishedCourse = false;

      // 2. Process each course
      for (const courseData of dto.courses) {
        // Upload multimedia to Cloudinary and create record
        const cloudinaryUrl = await this.uploadUrlToCloudinary(
          courseData.multimedia_url,
        );
        const multimediaId = await this.createMultimediaRecord(
          prisma,
          request,
          cloudinaryUrl,
        );

        // Find the closest matching category
        const categoryId = await this.findClosestCategory(
          prisma,
          courseData.category_name,
        );

        // Create course
        const course = await prisma.product.create({
          data: {
            title: courseData.title,
            slug: courseData.slug,
            description: courseData.description,
            price: courseData.price,
            keywords: courseData.keywords,
            metadata: courseData.metadata,
            status: courseData.status || ProductStatus.DRAFT,
            published_at:
              courseData.status === ProductStatus.PUBLISHED ? new Date() : null,
            type: ProductType.COURSE,
            creator: { connect: { id: auth.sub } },
            business_info: { connect: { id: businessId } },
            multimedia: { connect: { id: multimediaId } },
            category: { connect: { id: categoryId } },
          },
        });

        createdCourses.push(course);

        // Check if this is the first published course
        if (courseData.status === ProductStatus.PUBLISHED) {
          const publishedCoursesCount = await prisma.product.count({
            where: {
              business_id: businessId,
              type: ProductType.COURSE,
              status: ProductStatus.PUBLISHED,
              id: { not: course.id },
            },
          });

          if (publishedCoursesCount === 0) {
            isFirstPublishedCourse = true;
          }
        }
      }

      // 3. Update onboarding status if not updated to 5
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

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE,
          entity: 'Course',
          entity_id: createdCourses.map((c) => c.id).join(','),
          metadata: `User with ID ${auth.sub} bulk created ${createdCourses.length} courses for Business ID ${businessId}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: `${createdCourses.length} courses created successfully.`,
        data: createdCourses,
      };
    });
  }
}
