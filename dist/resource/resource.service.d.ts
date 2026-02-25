import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto, FilterResourceDto, UpdateResourceDto } from './resource.dto';
import { Resource } from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
export declare class ResourceService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly resourceRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateResourceDto): Promise<GenericPayloadAlias<Resource>>;
    fetch(payload: AuthPayload, filterDto: FilterResourceDto): Promise<PagePayload<Resource>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Resource>>;
    update(request: AuthPayload & Request, param: IdDto, dto: UpdateResourceDto): Promise<GenericPayloadAlias<Resource>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
}
