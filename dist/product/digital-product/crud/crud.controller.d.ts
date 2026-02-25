import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { CreateDigitalProductDto, UpdateDigitalProductDto } from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { Product } from '@prisma/client';
import { DigitalProductCrudService } from './crud.service';
import { DeleteDigitalProduct } from './crud.payload';
import { FilterProductDto } from '@/product/general/general.dto';
export declare class DigitalProductCrudController {
    private readonly digitalProductCrudService;
    constructor(digitalProductCrudService: DigitalProductCrudService);
    create(request: AuthPayload & Request, createDigitalProductDto: CreateDigitalProductDto): Promise<GenericPayloadAlias<Product>>;
    fetch(request: AuthPayload & Request, filterDigitalProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<Product>>;
    update(request: AuthPayload & Request, param: IdDto, updateDigitalProductDto: UpdateDigitalProductDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeleteDigitalProduct>>;
}
