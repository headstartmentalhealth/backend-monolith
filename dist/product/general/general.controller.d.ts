import { ProductGeneralService } from './general.service';
import { AuthPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { FilterProductDto } from '../ticket/crud/crud.dto';
import { Product } from '@prisma/client';
export declare class ProductGeneralController {
    private readonly productGeneralService;
    constructor(productGeneralService: ProductGeneralService);
    fetch(request: AuthPayload & Request, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchAll(request: AuthPayload & Request, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchOrganizationProducts(businessId: string, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchProductByIdPublic(productId: string, query: {
        currency?: string;
    }): Promise<GenericPayloadAlias<Product | any>>;
}
