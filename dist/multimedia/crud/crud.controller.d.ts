import { MultimediaCrudService } from './crud.service';
import { AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CreateMultimediaDto } from './crud.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Multimedia } from '@prisma/client';
export declare class MultimediaCrudController {
    private readonly multimediaCrudService;
    constructor(multimediaCrudService: MultimediaCrudService);
    create(request: AuthPayload & Request, createMultimediaDto: CreateMultimediaDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, queryDto: QueryDto): Promise<PagePayload<Multimedia>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    fetchAll(request: AuthPayload & Request, queryDto: QueryDto): Promise<PagePayload<Multimedia>>;
}
