import { TicketCrudService } from './crud.service';
import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { CreateTicketDto, FilterProductDto, TicketTierIdDto, UpdateTicketDto } from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { Product } from '@prisma/client';
import { DeleteTicket, DeleteTicketTier } from './crud.payload';
export declare class TicketCrudController {
    private readonly ticketCrudService;
    constructor(ticketCrudService: TicketCrudService);
    create(request: AuthPayload & Request, createTicketDto: CreateTicketDto): Promise<GenericPayloadAlias<Product>>;
    fetch(request: AuthPayload & Request, filterTicketDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<Product>>;
    update(request: AuthPayload & Request, param: IdDto, updateTicketDto: UpdateTicketDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeleteTicket>>;
    removeTier(request: AuthPayload & Request, param: TicketTierIdDto): Promise<GenericPayloadAlias<DeleteTicketTier>>;
}
