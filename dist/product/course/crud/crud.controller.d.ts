import { CourseCrudService } from './crud.service';
import { CreateCourseDto, FilterCourseDto, UpdateCourseDto, BulkCreateCourseDto } from './crud.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
import { Product } from '@prisma/client';
export declare class CourseCrudController {
    private readonly courseService;
    constructor(courseService: CourseCrudService);
    create(request: AuthPayload & Request, createCourseDto: CreateCourseDto): Promise<GenericPayloadAlias<Product>>;
    fetch(request: AuthPayload & Request, filterCourseDto: FilterCourseDto): Promise<PagePayload<Product>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<Product>>;
    update(request: AuthPayload & Request, param: IdDto, updateCourseDto: UpdateCourseDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    bulkCreate(request: AuthPayload & Request, dto: BulkCreateCourseDto): Promise<GenericPayloadAlias<Product[]>>;
}
