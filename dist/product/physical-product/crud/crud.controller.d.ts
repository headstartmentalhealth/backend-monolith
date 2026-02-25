import { PhysicalProductCrudService } from './crud.service';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { Product } from '@prisma/client';
import { AddPhysicalProductMedia, CreatePhysicalProductDto, ProductDto, UpdatePhysicalProductDto } from './crud.dto';
import { FilterProductDto } from '@/product/general/general.dto';
import { IdDto } from '@/generic/generic.dto';
import { DeletePhysicalProduct } from './crud.payload';
export declare class PhysicalProductCrudController {
    private readonly physicalProductCrudService;
    constructor(physicalProductCrudService: PhysicalProductCrudService);
    create(request: AuthPayload & Request, createPhysicalProductDto: CreatePhysicalProductDto): Promise<GenericPayloadAlias<Product>>;
    fetch(request: AuthPayload & Request, filterPhysicalProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<Product>>;
    update(request: AuthPayload & Request, param: IdDto, updatePhysicalProductDto: UpdatePhysicalProductDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeletePhysicalProduct>>;
    removeSinglePhysicalProductMedia(request: AuthPayload & Request, paramDto: IdDto): Promise<GenericPayload>;
    addPhysicalProductMedia(request: AuthPayload & Request, productDto: ProductDto, addPhysicalProductMedia: AddPhysicalProductMedia): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        data: {
            multimedia_id: string;
        }[];
    }>;
}
