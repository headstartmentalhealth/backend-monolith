import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilterByYearDto } from './owner.dto';
export declare class OwnerService {
    private readonly prisma;
    private readonly configService;
    private readonly paymentRepository;
    private readonly businessInformationRepository;
    constructor(prisma: PrismaService, configService: ConfigService);
    getMetrics(): Promise<{
        statusCode: HttpStatus;
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
    getYearlyRevenueBreakdown(filterByYearDto: FilterByYearDto): Promise<{
        statusCode: HttpStatus;
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
    getProductCountByType(): Promise<{
        statusCode: HttpStatus;
        data: {
            course: number;
            ticket: number;
        };
    }>;
}
