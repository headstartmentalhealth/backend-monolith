import { BusinessSize } from '@prisma/client';
import { BusinessOwnerAccountRole } from '@/generic/generic.data';
import { QueryDto } from '@/generic/generic.dto';
export declare class SocialMediaHandle {
    handle: string;
    link: string;
}
export declare class SaveBusinessInfoDto {
    business_name: string;
    business_description?: string;
    social_media_handles?: SocialMediaHandle[];
    business_size: BusinessSize;
    business_slug?: string;
    timeline?: string;
    logo_url?: string;
    industry: string;
    working_hours?: string;
    location?: string;
    state?: string;
    country?: string;
}
export declare class UpsertWithdrawalAccountDto {
    business_id: string;
    account_number: string;
    account_type: string;
    bank_code: string;
    bank_name: string;
    routing_number?: string;
    country?: string;
    recipient_code?: string;
}
export declare class FilterBusinessDto extends QueryDto {
    q?: string;
    deleted?: string;
}
export declare class SuspendBusinessOwnerDto {
    suspension_reason: string;
}
export declare class FilterBusinessOwnerDto extends QueryDto {
    q?: string;
}
export declare class ImportBusinessUserDto {
    name: string;
    email: string;
    role?: string;
    phone?: string;
}
export declare class ImportBusinessUsersDto {
    users: ImportBusinessUserDto[];
}
export declare class ExportBusinessUsersDto {
    format?: 'csv' | 'json' | 'xlsx';
    role?: BusinessOwnerAccountRole;
}
export declare class AddCustomerDto {
    name: string;
    email: string;
    phone: string;
    business_id: string;
}
export declare class UpsertKycDto {
    doc_front: string;
    doc_back: string;
    utility_doc: string;
    location: string;
    state: string;
    city: string;
    country: string;
    id_type: string;
    is_approved?: boolean;
    disapproval_reason?: string;
}
export declare class ReviewKycDto {
    is_approved: boolean;
    disapproval_reason?: string;
}
export declare class BusinessNameDto {
    business_name: string;
}
export declare enum OnboardingProcesses {
    BUSINESS_DETAILS = "BUSINESS_DETAILS",
    KYC = "KYC",
    WITHDRAWAL_ACCOUNT = "WITHDRAWAL_ACCOUNT",
    TEAM_MEMBERS_INVITATION = "TEAM_MEMBERS_INVITATION",
    PRODUCT_CREATION = "PRODUCT_CREATION"
}
export declare class UpdateBusinessProcessesDto {
    process: OnboardingProcesses;
}
