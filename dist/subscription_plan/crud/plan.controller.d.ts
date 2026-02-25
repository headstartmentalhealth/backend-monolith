import { SubscriptionPlanService } from './plan.service';
import { CreateSubscriptionPlanDto, CreateSubscriptionPlanDto2, FilterBusinessPlansDto, FilterPlanDto, FilterSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionPlanDto2 } from './plan.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload, Timezone } from '@/generic/generic.payload';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { SubscriptionPlan } from '@prisma/client';
import { PlanSelection, RelatedModels } from './plan.utils';
export declare class SubscriptionPlanController {
    private readonly subscriptionPlanService;
    constructor(subscriptionPlanService: SubscriptionPlanService);
    create(request: AuthPayload & Request, createSubPlanDto: CreateSubscriptionPlanDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, param: {
        business_id: string;
    }, queryDto: FilterPlanDto): Promise<PagePayload<SubscriptionPlan>>;
    findSingle(request: AuthPayload & Request, param: IdDto): Promise<GenericDataPayload<PlanSelection & RelatedModels>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, updateSubPlanDto: UpdateSubscriptionPlanDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    publicFetch(request: Timezone & Request, param: {
        business_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlan>>;
    fetchBusinessPlans(request: AuthPayload & Request, filterBusinessPlanDto: FilterBusinessPlansDto): Promise<PagePayload<SubscriptionPlan>>;
    bulkCreate(request: AuthPayload & Request, dto: CreateSubscriptionPlanDto2): Promise<GenericDataPayload<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string;
        name: string;
        product_id: string | null;
        description: string | null;
        cover_image: string | null;
        creator_id: string;
    }>>;
    bulkUpdate(id: string, dto: UpdateSubscriptionPlanDto2, request: AuthPayload & Request): Promise<GenericPayload>;
    fetchPublicSubscriptionPlans(request: Timezone & Request, businessId: string, filterDto: FilterSubscriptionPlanDto): Promise<PagePayload<SubscriptionPlan>>;
}
