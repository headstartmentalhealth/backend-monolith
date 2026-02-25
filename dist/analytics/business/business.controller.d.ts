import { BusinessAnalyticsService } from './business.service';
import { ProductRevenueMonthlyDto } from './business.dto';
import { AuthPayload, GenericDataPayload } from '@/generic/generic.payload';
import { CurrencyDto } from '@/generic/generic.dto';
export declare class BusinessAnalyticsController {
    private readonly businessAnalyticsService;
    constructor(businessAnalyticsService: BusinessAnalyticsService);
    getBusinessAnalytics(auth: AuthPayload & Request, query: CurrencyDto): Promise<GenericDataPayload<any>>;
    getProductRevenueBreakdown(auth: AuthPayload & Request): Promise<any>;
    getMonthlyProductRevenueBreakdown(auth: AuthPayload & Request, query: ProductRevenueMonthlyDto): Promise<any>;
}
