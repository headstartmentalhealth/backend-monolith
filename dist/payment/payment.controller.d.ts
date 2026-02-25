import { PaymentService } from './payment.service';
import { AuthPayload, GenericPayload, GenericPayloadAlias, PagePayload, Timezone } from '@/generic/generic.payload';
import { CreatePaymentDto, PaymentIdDto, QueryPaymentsDto, VerifyPaymentDto } from './payment.dto';
import { Payment, PaymentStatus } from '@prisma/client';
import { IdDto } from '@/generic/generic.dto';
import { GenericDataPayload } from '@/generic/generic.payload';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createPayment(request: Timezone & Request, createPaymentDto: CreatePaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            payment_id: string;
            authorization_url: any;
        };
    }>;
    verifyPayment(request: Timezone & Request, verifyPaymentDto: VerifyPaymentDto): Promise<GenericPayload>;
    cancelPayment(request: Timezone & Request, paymentIdDto: PaymentIdDto): Promise<GenericPayloadAlias<{
        payment_id: string;
        status: PaymentStatus;
    }>>;
    fetchPayments(request: AuthPayload & Request, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment>>;
    fetch(request: AuthPayload & Request, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment>>;
    fetchPayment(request: AuthPayload & Request, idDto: IdDto): Promise<PagePayload<Payment>>;
    fetchDistinctCustomerPayments(request: AuthPayload & Request, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment>>;
    fetchClientPayments(request: AuthPayload & Request, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment>>;
    fetchClientPayment(request: AuthPayload & Request, idDto: IdDto): Promise<GenericDataPayload<Payment>>;
    fetchClientPaymentSummary(request: AuthPayload & Request): Promise<GenericDataPayload<any>>;
}
