import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateTicketDto, FilterProductDto, TicketTierIdDto, UpdateTicketDto } from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { DeleteTicket, DeleteTicketTier } from './crud.payload';
export declare class TicketCrudService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly productRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, createTicketDto: CreateTicketDto): Promise<GenericPayloadAlias<Product>>;
    fetch(payload: AuthPayload, filterTicketDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Product>>;
    findOne(id: string): Promise<Product>;
    update(request: AuthPayload & Request, param: IdDto, dto: UpdateTicketDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeleteTicket>>;
    private hasRelatedRecords;
    removeTicketTier(request: AuthPayload & Request, param: TicketTierIdDto): Promise<GenericPayloadAlias<DeleteTicketTier>>;
}
