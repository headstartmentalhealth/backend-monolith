import { HttpStatus } from '@nestjs/common';
import { CourseModuleService } from './module.service';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { BulkUpdateModulesDto, CourseIdDto, CreateModuleDto, CreateMultipleModulesDto, RearrangeModulesDto, UpdateModuleDto } from './module.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Module } from '@prisma/client';
export declare class CourseModuleController {
    private readonly moduleService;
    constructor(moduleService: CourseModuleService);
    create(request: AuthPayload & Request, createModuleDto: CreateModuleDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, queryDto: QueryDto, courseIdDto: CourseIdDto): Promise<PagePayload<Module>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<Module>>;
    update(request: AuthPayload & Request, param: IdDto, updateModuleDto: UpdateModuleDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    rearrange(request: AuthPayload & Request, param: {
        course_id: string;
    }, dto: RearrangeModulesDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    createMultiple(request: AuthPayload & Request, dto: CreateMultipleModulesDto): Promise<GenericPayload>;
    bulkUpdateModules(request: AuthPayload & Request, dto: BulkUpdateModulesDto): Promise<GenericPayload>;
}
