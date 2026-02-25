import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { ModuleContent } from '@prisma/client';
import { CreateModuleContentDto, RearrangeModuleContentsDto, UpdateModuleContentDto } from './module-content.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { CourseModuleService } from '../module/module.service';
export declare class ModuleContentService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly courseModuleService;
    private readonly moduleContentRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService, courseModuleService: CourseModuleService);
    create(request: AuthPayload & Request, createModuleContentDto: CreateModuleContentDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, queryDto: QueryDto): Promise<PagePayload<ModuleContent>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<ModuleContent>>;
    private findOne;
    update(request: AuthPayload & Request, param: IdDto, updateModuleContentDto: UpdateModuleContentDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    rearrange(request: AuthPayload & Request, param: {
        module_id: string;
    }, dto: RearrangeModuleContentsDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
