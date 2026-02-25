import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { Module } from '@prisma/client';
import { BulkUpdateModulesDto, CourseIdDto, CreateModuleDto, CreateMultipleModulesDto, RearrangeModulesDto, UpdateModuleDto } from './module.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { CourseCrudService } from '../crud/crud.service';
export declare class CourseModuleService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly courseCrudService;
    private readonly moduleRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService, courseCrudService: CourseCrudService);
    create(request: AuthPayload & Request, createModuleDto: CreateModuleDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, queryDto: QueryDto, courseIdDto: CourseIdDto): Promise<PagePayload<Module>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Module>>;
    findOne(id: string): Promise<Module>;
    update(request: AuthPayload & Request, param: IdDto, updateModuleDto: UpdateModuleDto): Promise<GenericPayload>;
    private hasRelatedRecords;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    rearrange(request: AuthPayload & Request, param: {
        course_id: string;
    }, dto: RearrangeModulesDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    createMultipleModulesWithContents(request: AuthPayload & Request, dto: CreateMultipleModulesDto): Promise<GenericPayload>;
    bulkUpdateModules(request: AuthPayload & Request, dto: BulkUpdateModulesDto): Promise<GenericPayload>;
}
