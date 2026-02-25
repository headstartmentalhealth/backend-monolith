import { IdDto, QueryDto } from '@/generic/generic.dto';
import { AuthPayload, GenericDataPayload, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { EnrolledCourse } from '@prisma/client';
import { ContentIdDto } from './enrolled.payload';
export declare class EnrolledCourseService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly enrolledCourseRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    fetch(payload: AuthPayload, queryDto: QueryDto): Promise<PagePayload<EnrolledCourse>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<EnrolledCourse>>;
    fetchByCourseId(payload: AuthPayload, courseId: string): Promise<GenericDataPayload<EnrolledCourse>>;
    findOne(id: string): Promise<EnrolledCourse>;
    private getLessonProgress;
    updateLessonProgress(request: AuthPayload & Request, param: ContentIdDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
