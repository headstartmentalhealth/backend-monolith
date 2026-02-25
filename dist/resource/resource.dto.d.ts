import { ResourceType } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';
export declare class CreateResourceDto {
    title: string;
    description?: string;
    resource_type: ResourceType;
    content_url?: string;
    cover_image?: string;
    category?: string;
    age_range?: string;
    topic?: string;
    minutes?: number;
}
export declare class UpdateResourceDto {
    title?: string;
    description?: string;
    resource_type?: ResourceType;
    content_url?: string;
    cover_image?: string;
    category?: string;
    age_range?: string;
    topic?: string;
    minutes?: number;
}
export declare class FilterResourceDto extends QueryDto {
    q?: string;
    resource_type?: ResourceType;
    topic?: string;
}
