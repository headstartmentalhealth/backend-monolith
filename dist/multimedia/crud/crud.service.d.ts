import { AuthPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Multimedia } from '@prisma/client';
import { CreateMultimediaDto, FilterMultimediaDto } from './crud.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
export declare class MultimediaCrudService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly multimediaRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, createMultimediaDto: CreateMultimediaDto): Promise<GenericPayloadAlias<Multimedia>>;
    createMany(request: AuthPayload & Request, createMultimediaDtos: CreateMultimediaDto[]): Promise<GenericPayload>;
    fetch(payload: AuthPayload, queryDto: QueryDto): Promise<PagePayload<Multimedia>>;
    private findOne;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    fetchAll(payload: AuthPayload & Request, filterMultimediaDto: FilterMultimediaDto): Promise<PagePayload<Multimedia>>;
}
