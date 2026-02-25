import { EnrolledCourseService } from './enrolled.service';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { EnrolledCourse } from '@prisma/client';
import { ContentIdDto } from './enrolled.payload';
export declare class EnrolledCourseController {
    private readonly enrolledCourseService;
    constructor(enrolledCourseService: EnrolledCourseService);
    fetch(request: AuthPayload & Request, queryDto: QueryDto): Promise<PagePayload<EnrolledCourse>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<EnrolledCourse>>;
    fetchByCourseId(request: AuthPayload & Request, courseId: string): Promise<GenericDataPayload<EnrolledCourse>>;
    update(request: AuthPayload & Request, param: ContentIdDto): Promise<GenericPayload>;
}
