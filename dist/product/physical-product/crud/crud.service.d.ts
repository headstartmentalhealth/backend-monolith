import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { PhysicalProduct, Prisma, Product } from '@prisma/client';
import { AddPhysicalProductMedia, CreatePhysicalProductDto, ProductDto, UpdatePhysicalProductDto } from './crud.dto';
import { FilterProductDto } from '@/product/general/general.dto';
import { IdDto } from '@/generic/generic.dto';
import { DeletePhysicalProduct } from './crud.payload';
export declare class PhysicalProductCrudService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly productRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, createPhysicalProductDto: CreatePhysicalProductDto): Promise<GenericPayloadAlias<Product>>;
    fetch(payload: AuthPayload, filterProductDto: FilterProductDto): Promise<PagePayload<Product>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<Product>>;
    findOne(id: string): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.ProductType;
        business_id: string;
        currency: string | null;
        description: string | null;
        creator_id: string;
        status: import(".prisma/client").$Enums.ProductStatus;
        price: Prisma.Decimal | null;
        other_currencies: Prisma.JsonValue | null;
        title: string;
        keywords: string | null;
        published_at: Date | null;
        archived_at: Date | null;
        multimedia_id: string | null;
        sku: string | null;
        category_id: string;
        slug: string | null;
        readiness_percent: number | null;
        original_price: Prisma.Decimal | null;
        multimedia_zip_id: string | null;
    } & {
        physical_product: PhysicalProduct;
    }>;
    update(request: AuthPayload & Request, param: IdDto, dto: UpdatePhysicalProductDto): Promise<GenericPayloadAlias<Product>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<DeletePhysicalProduct>>;
    private hasRelatedRecords;
    removeSinglePhysicalProductMedia(request: AuthPayload & Request, paramDto: IdDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    addPhysicalProductMedia(request: AuthPayload & Request, productDto: ProductDto, addPhysicalProductMedia: AddPhysicalProductMedia): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            multimedia_id: string;
        }[];
    }>;
}
