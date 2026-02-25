import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, PrismaClient, ProductCategory } from '@prisma/client';
import { CreateProductCategoryDto, FilterProductCategoryDto } from './category.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { IdDto } from '@/generic/generic.dto';
export declare class ProductCategoryService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly productCategoryRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    nameExists(name: string, business_id: string, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<void>;
    create(request: AuthPayload & Request, createCategoryDto: CreateProductCategoryDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, filterProductCategoryDto: FilterProductCategoryDto): Promise<PagePayload<ProductCategory>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<ProductCategory>>;
    findOne(id: string): Promise<ProductCategory>;
    update(request: AuthPayload & Request, param: IdDto, updateProductCategoryDto: Partial<CreateProductCategoryDto>): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    private hasRelatedRecords;
}
