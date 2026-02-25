import { QueryDto } from '@/generic/generic.dto';
export declare class CreateWithdrawalDto {
    amount: number;
    currency: string;
    password: string;
}
export declare class InitiateWithdrawalDto {
    withdrawalId: string;
}
export declare class FinalizeWithdrawalDto {
    otp: string;
    withdrawalId: string;
}
export declare class VerifyWithdrawalDto {
    reference: string;
}
export declare enum WithdrawalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class UpdateWithdrawalDto {
    status: WithdrawalStatus;
    notes?: string;
    processed_by?: string;
}
export declare class QueryWithdrawRequestsDto extends QueryDto {
    q?: string;
}
export declare class WithdrawNoteDto {
    transfer_code: string;
    reference: string;
}
