import { ProductCategoryService } from './category.service';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CreateProductCategoryDto, FilterProductCategoryDto } from './category.dto';
import { ProductCategory } from '@prisma/client';
import { IdDto } from '@/generic/generic.dto';
export declare class ProductCategoryController {
    private readonly productCategoryService;
    constructor(productCategoryService: ProductCategoryService);
    create(request: AuthPayload & Request, createProductCategoryDto: CreateProductCategoryDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, filterProductCategoryDto: FilterProductCategoryDto): Promise<PagePayload<ProductCategory>>;
    fetchSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<ProductCategory>>;
    update(request: AuthPayload & Request, param: IdDto, updateProductCategoryDto: Partial<CreateProductCategoryDto>): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
}
