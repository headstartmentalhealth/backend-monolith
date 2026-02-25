import { ModuleContentService } from './module-content.service';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CreateModuleContentDto, RearrangeModuleContentsDto, UpdateModuleContentDto } from './module-content.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { ModuleContent } from '@prisma/client';
export declare class ModuleContentController {
    private readonly moduleContentService;
    constructor(moduleContentService: ModuleContentService);
    create(request: AuthPayload & Request, createModuleContentDto: CreateModuleContentDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, queryDto: QueryDto): Promise<PagePayload<ModuleContent>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<ModuleContent>>;
    update(request: AuthPayload & Request, param: IdDto, updateModuleContentDto: UpdateModuleContentDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    rearrange(request: AuthPayload & Request, param: {
        module_id: string;
    }, dto: RearrangeModuleContentsDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
}
