import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCourseDto, FilterCourseDto, UpdateCourseDto, BulkCreateCourseDto } from './crud.dto';
import { Course, Product } from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
export declare class CourseCrudService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly productRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, createCourseDto: CreateCourseDto): Promise<GenericPayloadAlias<Product>>;
    fetch(payload: AuthPayload, filterCourseDto: FilterCourseDto): Promise<PagePayload<Product>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Product>>;
    findOne(id: string): Promise<Course>;
    update(request: AuthPayload & Request, param: IdDto, updateCourseDto: UpdateCourseDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    private hasRelatedRecords;
    private findClosestCategory;
    private uploadUrlToCloudinary;
    private createMultimediaRecord;
    bulkCreate(request: AuthPayload & Request, dto: BulkCreateCourseDto): Promise<GenericPayloadAlias<Product[]>>;
}
