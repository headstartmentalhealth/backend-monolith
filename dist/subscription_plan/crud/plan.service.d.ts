import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto, CreateSubscriptionPlanDto2, FilterBusinessPlansDto, FilterPlanDto, FilterSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionPlanDto2 } from './plan.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload, Timezone } from '../../generic/generic.payload';
import { LogService } from '../../log/log.service';
import { SubscriptionPlan } from '@prisma/client';
import { IdDto, QueryDto } from '../../generic/generic.dto';
import { GenericService } from '../../generic/generic.service';
import { PlanSelection, RelatedModels } from './plan.utils';
export declare class SubscriptionPlanService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly subscriptionPlanRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateSubscriptionPlanDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, param: {
        business_id: string;
    }, queryDto: FilterPlanDto): Promise<PagePayload<SubscriptionPlan>>;
    private findOne;
    findSingle(param: IdDto): Promise<GenericDataPayload<PlanSelection & RelatedModels>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, dto: UpdateSubscriptionPlanDto): Promise<GenericPayload>;
    private hasRelatedRecords;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    publicFetch(payload: Timezone & Request, param: {
        business_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlan>>;
    fetchBusinessPlans(payload: AuthPayload & Request, filterDto: FilterBusinessPlansDto): Promise<PagePayload<SubscriptionPlan>>;
    createSubscriptionPlan(request: AuthPayload & Request, data: CreateSubscriptionPlanDto2): Promise<GenericDataPayload<SubscriptionPlan>>;
    updateSubscriptionPlan(id: string, dto: UpdateSubscriptionPlanDto2, request: AuthPayload & Request): Promise<GenericPayload>;
    fetchPublicSubscriptionPlans(businessId: string, filterDto: FilterSubscriptionPlanDto): Promise<PagePayload<SubscriptionPlan>>;
}
