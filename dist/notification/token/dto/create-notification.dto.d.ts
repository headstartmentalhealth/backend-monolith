import { Role } from '@/generic/generic.data';
export declare class CreateNotificationDto {
    title: string;
    body: string;
    user_group: Role;
    user_id?: string;
    link?: string;
}
