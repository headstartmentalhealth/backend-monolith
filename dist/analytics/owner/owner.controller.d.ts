import { OwnerService } from './owner.service';
import { FilterByYearDto } from './owner.dto';
export declare class OwnerController {
    private readonly ownerService;
    constructor(ownerService: OwnerService);
    fetchMetrics(): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            total_organizations: number;
            total_revenue: string;
            total_product_orders: number;
            total_withdrawals: number;
            total_library_materials: number;
            total_audio_contents: number;
            total_blog_posts: number;
        };
    }>;
    fetchYearlyRevenueBreakdown(filterByYearDto: FilterByYearDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            year: number;
            monthly_breakdown: {
                month: string;
                product_revenue: string;
                subscription_revenue: string;
                withdrawals: string;
            }[];
            totals: {
                product_revenue: string;
                subscription_revenue: string;
                withdrawals: string;
            };
        };
    }>;
    fetchProductCountByType(): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            course: number;
            ticket: number;
        };
    }>;
}
