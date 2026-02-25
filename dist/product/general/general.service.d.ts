import { AuthPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Product } from '@prisma/client';
import { FilterProductDto } from '../ticket/crud/crud.dto';
export declare class ProductGeneralService {
    private readonly prisma;
    private readonly genericService;
    private readonly productRepository;
    private readonly select;
    constructor(prisma: PrismaService, genericService: GenericService);
    fetch(payload: AuthPayload, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchAll(payload: AuthPayload, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchOrganizationProducts(businessId: string, filterDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchProductByIdPublic(productId: string, currency?: string): Promise<GenericPayloadAlias<Product | any>>;
}
