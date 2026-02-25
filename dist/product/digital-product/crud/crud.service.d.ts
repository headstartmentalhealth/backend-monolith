import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateDigitalProductDto, UpdateDigitalProductDto } from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { DeleteDigitalProduct } from './crud.payload';
import { FilterProductDto } from '@/product/general/general.dto';
export declare class DigitalProductCrudService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly productRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, createDigitalProductDto: CreateDigitalProductDto): Promise<GenericPayloadAlias<Product>>;
    fetch(payload: AuthPayload, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Product>>;
    findOne(id: string): Promise<Product>;
    update(request: AuthPayload & Request, param: IdDto, dto: UpdateDigitalProductDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeleteDigitalProduct>>;
    private hasRelatedRecords;
}
