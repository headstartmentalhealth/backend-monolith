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
exports.EnrolledCourseService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const generic_utils_1 = require("../../../generic/generic.utils");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let EnrolledCourseService = class EnrolledCourseService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'EnrolledCourse';
        this.select = {
            id: true,
            enrolled_at: true,
            completed_lessons: true,
            total_lessons: true,
            progress: true,
            status: true,
            course_id: true,
            created_at: true,
            updated_at: true,
            course: true,
        };
        this.enrolledCourseRepository = new prisma_base_repository_1.PrismaBaseRepository('enrolledCourse', prisma);
    }
    async fetch(payload, queryDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            user_id: auth.sub,
            tz: payload.timezone,
            ...pagination_filters.filters,
        };
        const select = this.select;
        const [enrolled_courses, total] = await Promise.all([
            this.enrolledCourseRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.enrolledCourseRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: enrolled_courses,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        const select = {
            ...this.select,
            course: {
                include: {
                    modules: {
                        include: {
                            contents: {
                                include: { progress: { where: { user_id: auth.sub } } },
                            },
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            business_info: { select: { id: true, business_name: true } },
                        },
                    },
                },
            },
        };
        const filters = {
            id: param.id,
            user_id: auth.sub,
        };
        const enrolled_course = await this.enrolledCourseRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: enrolled_course,
        };
    }
    async fetchByCourseId(payload, courseId) {
        const auth = payload.user;
        const select = {
            ...this.select,
            course: {
                include: {
                    modules: {
                        include: {
                            contents: {
                                include: {
                                    progress: {
                                        where: { user_id: auth.sub },
                                    },
                                    multimedia: true,
                                },
                            },
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            business_info: {
                                select: {
                                    id: true,
                                    business_name: true,
                                    logo_url: true,
                                },
                            },
                        },
                    },
                },
            },
        };
        const filters = {
            course_id: courseId,
            user_id: auth.sub,
        };
        const enrolled_course = await this.enrolledCourseRepository.findOne(filters, undefined, select);
        if (!enrolled_course) {
            throw new common_1.NotFoundException('You are not enrolled in this course.');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: enrolled_course,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const enrolled_course = await this.enrolledCourseRepository.findOne(filters, undefined, select);
        if (!enrolled_course) {
            throw new common_1.NotFoundException(`Enrolled course not found.`);
        }
        return enrolled_course;
    }
    async getLessonProgress(course_id, user_id, prisma) {
        const total_lessons = await prisma.moduleContent.count({
            where: { module: { course_id } },
        });
        const completed_lessons = await prisma.userCourseProgress.count({
            where: { user_id, course_id },
        });
        const progress = total_lessons > 0
            ? Math.floor((completed_lessons / total_lessons) * 100)
            : 0;
        return {
            total_lessons,
            completed_lessons,
            progress,
        };
    }
    async updateLessonProgress(request, param) {
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            const module_content = await prisma.moduleContent.findUnique({
                where: { id: param.content_id },
                include: { module: true },
            });
            if (!module_content) {
                throw new common_1.NotFoundException('Module content not found.');
            }
            const existing_progress = await prisma.userCourseProgress.findUnique({
                where: {
                    user_id_module_content_id: {
                        user_id: auth.sub,
                        module_content_id: module_content.id,
                    },
                },
            });
            if (existing_progress) {
                await prisma.userCourseProgress.delete({
                    where: { id: existing_progress.id },
                });
            }
            else {
                await prisma.userCourseProgress.create({
                    data: {
                        user_id: auth.sub,
                        course_id: module_content.module.course_id,
                        module_content_id: module_content.id,
                        completed_at: new Date(),
                    },
                });
            }
            const { total_lessons, completed_lessons, progress } = await this.getLessonProgress(module_content.module.course_id, auth.sub, prisma);
            const updated_enrolled = await prisma.enrolledCourse.update({
                where: {
                    user_id_course_id: {
                        user_id: auth.sub,
                        course_id: module_content.module.course_id,
                    },
                },
                data: { completed_lessons, total_lessons, progress },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.UPDATE_COURSE_PROGRESS,
                entity: this.model,
                entity_id: updated_enrolled.id,
                metadata: `User with ID ${auth.sub} just updated their lesson progress of enrolled course ID ${updated_enrolled.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Lesson progress updated successfully.',
            };
        });
    }
};
exports.EnrolledCourseService = EnrolledCourseService;
exports.EnrolledCourseService = EnrolledCourseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], EnrolledCourseService);
//# sourceMappingURL=enrolled.service.js.map