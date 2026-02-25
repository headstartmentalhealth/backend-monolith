import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthPayload, GenericDataPayload } from '@/generic/generic.payload';
import { CurrencyDto } from '@/generic/generic.dto';
export declare class BusinessAnalyticsService {
    private readonly prisma;
    private readonly configService;
    private readonly paymentRepository;
    private readonly subscriptionRepository;
    private readonly enrolledCourseRepository;
    private readonly businessContactRepository;
    constructor(prisma: PrismaService, configService: ConfigService);
    getBusinessAnalytics(payload: AuthPayload & Request, query: CurrencyDto): Promise<GenericDataPayload<any>>;
    private fetchTotalRevenue;
    private getTotalRevenue;
    private getActiveSubscriptions;
    private getAllClients;
    private getCourseCompletions;
    getProductRevenueBreakdown(payload: AuthPayload & Request): Promise<{
        statusCode: number;
        data: {
            course: {
                amount: number;
                formatted: string;
            };
            ticket: {
                amount: number;
                formatted: string;
            };
            subscription: {
                amount: number;
                formatted: string;
            };
            digital: {
                amount: number;
                formatted: string;
            };
        };
    }>;
    getMonthlyProductRevenueBreakdown(payload: AuthPayload & Request, year?: number): Promise<{
        statusCode: number;
        data: {
            year: number;
            currencies: {
                currency: string;
                currency_sign: string;
                months: {
                    month: string;
                    course: {
                        amount: number;
                        formatted: string;
                    };
                    ticket: {
                        amount: number;
                        formatted: string;
                    };
                    subscription: {
                        amount: number;
                        formatted: string;
                    };
                    digital: {
                        amount: number;
                        formatted: string;
                    };
                }[];
            }[];
        };
    }>;
}
