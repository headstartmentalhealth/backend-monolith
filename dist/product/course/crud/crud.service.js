"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseCrudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../../../log/log.service");
const generic_service_1 = require("../../../generic/generic.service");
const generic_utils_1 = require("../../../generic/generic.utils");
const cloudinary_1 = require("cloudinary");
const axios_1 = require("axios");
const streamifier = require("streamifier");
let CourseCrudService = class CourseCrudService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'Product';
        this.select = {
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
                },
            },
            multimedia: true,
            category: true,
            other_currencies: true,
        };
        this.productRepository = new prisma_base_repository_1.PrismaBaseRepository('product', prisma);
    }
    async create(request, createCourseDto) {
        const auth = request.user;
        const { title, slug, description, multimedia_id, price, category_id, other_currencies, } = createCourseDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.validateOtherCurrencies(other_currencies, prisma);
            const product_slug = await prisma.product.findFirst({ where: { slug } });
            if (product_slug) {
                throw new common_1.ConflictException('Shortlink already exists.');
            }
            const onboarding_status = await prisma.onboardingStatus.findFirst({
                where: { business_id: request['Business-Id'] },
            });
            const multimedia = await prisma.multimedia.findUnique({
                where: { id: multimedia_id },
            });
            if (!multimedia) {
                throw new common_1.NotFoundException('Multimedia not found.');
            }
            const product_category = await prisma.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!product_category) {
                throw new common_1.NotFoundException('Category not found.');
            }
            const product_slug_details = await prisma.product.findFirst({
                where: { slug },
            });
            if (product_slug_details) {
                throw new common_1.BadRequestException(`This slug ${slug} is not available.`);
            }
            const course = await prisma.product.create({
                data: {
                    title,
                    slug,
                    description,
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                    multimedia: { connect: { id: multimedia_id } },
                    price,
                    type: client_1.ProductType.COURSE,
                    category: { connect: { id: category_id } },
                    readiness_percent: 15,
                    other_currencies: other_currencies
                        ? JSON.parse(JSON.stringify(other_currencies))
                        : undefined,
                },
            });
            if (onboarding_status.current_step < 5) {
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
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE,
                entity: 'Course',
                entity_id: course.id,
                metadata: `User with ID ${auth.sub} just created a course product ID ${course.id} for Business ID ${course.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Course created successfully.',
                data: course,
            };
        });
    }
    async fetch(payload, filterCourseDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterCourseDto);
        const filters = {
            business_id: payload['Business-Id'],
            type: client_1.ProductType.COURSE,
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
        const select = this.select;
        const [courses, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: courses,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const select = {
            ...this.select,
            creator: true,
        };
        const filters = {
            id: param.id,
        };
        const course = await this.productRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: course,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const course = await this.productRepository.findOne(filters, undefined, select);
        if (!course) {
            throw new common_1.NotFoundException(`Course not found.`);
        }
        return course;
    }
    async update(request, param, updateCourseDto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_course = await this.findOne(id);
            await this.genericService.validateOtherCurrencies(updateCourseDto.other_currencies, prisma);
            const response = await prisma.product.update({
                where: { id },
                data: {
                    ...updateCourseDto,
                    ...(updateCourseDto.status &&
                        updateCourseDto.status === client_1.CourseStatus.PUBLISHED && {
                        published_at: new Date(),
                    }),
                    ...(updateCourseDto.other_currencies && {
                        other_currencies: updateCourseDto.other_currencies
                            ? JSON.parse(JSON.stringify(updateCourseDto.other_currencies))
                            : undefined,
                    }),
                },
            });
            if (updateCourseDto.status === client_1.CourseStatus.PUBLISHED &&
                !existing_course.published_at) {
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
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE,
                entity: 'Course',
                entity_id: existing_course.id,
                metadata: `User with ID ${auth.sub} just updated a course ID ${existing_course.id} for business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Course updated successfully.',
                data: response,
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const existing_course = await this.findOne(id);
            if (existing_course.published_at) {
                throw new common_1.ForbiddenException('You cannot delete a published course.');
            }
            await this.hasRelatedRecords(existing_course.id);
            await prisma.product.update({
                where: { id: existing_course.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE,
                entity: 'Course',
                entity_id: existing_course.id,
                metadata: `User with ID ${auth.sub} just deleted a course ID ${existing_course.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Course deleted successfully.',
            };
        });
    }
    async hasRelatedRecords(product_id) {
        const relatedTables = [{ model: this.prisma.payment, field: 'product_id' }];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: {
                    purchase: {
                        path: ['items'],
                        array_contains: [{ product_id: product_id }],
                    },
                },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async findClosestCategory(prisma, categoryName) {
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
            throw new common_1.NotFoundException('No categories found in the system.');
        }
        const searchName = categoryName.toLowerCase();
        const exactMatch = categories.find((cat) => cat.name.toLowerCase() === searchName);
        if (exactMatch) {
            return exactMatch.id;
        }
        const partialMatch = categories.find((cat) => cat.name.toLowerCase().includes(searchName) ||
            searchName.includes(cat.name.toLowerCase()));
        if (partialMatch) {
            return partialMatch.id;
        }
        return categories[0].id;
    }
    async uploadUrlToCloudinary(url) {
        try {
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            return new Promise((resolve, reject) => {
                const upload = cloudinary_1.v2.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result.secure_url);
                });
                streamifier.createReadStream(buffer).pipe(upload);
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to process multimedia URL: ${error.message}`);
        }
    }
    async createMultimediaRecord(prisma, request, url) {
        const multimedia = await prisma.multimedia.create({
            data: {
                url,
                type: client_1.MultimediaType.IMAGE,
                provider: client_1.MultimediaProvider.CLOUDINARY,
                creator: { connect: { id: request.user.sub } },
                business_info: { connect: { id: request['Business-Id'] } },
            },
        });
        return multimedia.id;
    }
    async bulkCreate(request, dto) {
        const auth = request.user;
        const businessId = request['Business-Id'];
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: businessId,
            });
            const createdCourses = [];
            let isFirstPublishedCourse = false;
            for (const courseData of dto.courses) {
                const cloudinaryUrl = await this.uploadUrlToCloudinary(courseData.multimedia_url);
                const multimediaId = await this.createMultimediaRecord(prisma, request, cloudinaryUrl);
                const categoryId = await this.findClosestCategory(prisma, courseData.category_name);
                const course = await prisma.product.create({
                    data: {
                        title: courseData.title,
                        slug: courseData.slug,
                        description: courseData.description,
                        price: courseData.price,
                        keywords: courseData.keywords,
                        metadata: courseData.metadata,
                        status: courseData.status || client_1.ProductStatus.DRAFT,
                        published_at: courseData.status === client_1.ProductStatus.PUBLISHED ? new Date() : null,
                        type: client_1.ProductType.COURSE,
                        creator: { connect: { id: auth.sub } },
                        business_info: { connect: { id: businessId } },
                        multimedia: { connect: { id: multimediaId } },
                        category: { connect: { id: categoryId } },
                    },
                });
                createdCourses.push(course);
                if (courseData.status === client_1.ProductStatus.PUBLISHED) {
                    const publishedCoursesCount = await prisma.product.count({
                        where: {
                            business_id: businessId,
                            type: client_1.ProductType.COURSE,
                            status: client_1.ProductStatus.PUBLISHED,
                            id: { not: course.id },
                        },
                    });
                    if (publishedCoursesCount === 0) {
                        isFirstPublishedCourse = true;
                    }
                }
            }
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
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COURSE,
                entity: 'Course',
                entity_id: createdCourses.map((c) => c.id).join(','),
                metadata: `User with ID ${auth.sub} bulk created ${createdCourses.length} courses for Business ID ${businessId}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: `${createdCourses.length} courses created successfully.`,
                data: createdCourses,
            };
        });
    }
};
exports.CourseCrudService = CourseCrudService;
exports.CourseCrudService = CourseCrudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], CourseCrudService);
//# sourceMappingURL=crud.service.js.map