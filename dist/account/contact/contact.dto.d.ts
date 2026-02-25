import { EmailDto, QueryDto } from '@/generic/generic.dto';
import { MemberStatus } from '@prisma/client';
import { BusinessOwnerAccountRole, Role } from '@/generic/generic.data';
export declare class InviteContactDto extends EmailDto {
    business_id: string;
    name: string;
}
export declare class AcceptInviteDto {
    token: string;
    name: string;
    password: string;
}
export declare class FilterInvitesDto {
    status?: MemberStatus;
    role?: BusinessOwnerAccountRole;
}
export declare class FilterUserDto extends QueryDto {
    q?: string;
    business_id?: string;
    role?: Role;
    business_contacts?: boolean;
}
export declare class FilterContactsDto extends QueryDto {
    q?: string;
    business_id?: string;
    role?: Role;
    business_contacts?: boolean;
}
export declare class SendMessageDto {
    inquiry: string;
    description: string;
    name: string;
    email: string;
    organization: string;
    phone: string;
    message: string;
    captcha_token: string;
}
export declare class NewsletterSubscriptionDto {
    email: string;
}
