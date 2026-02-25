import { MultimediaType, MultimediaProvider } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';
export declare class CreateMultimediaDto {
    url: string;
    type: MultimediaType;
    provider: MultimediaProvider;
}
export declare class FilterMultimediaDto extends QueryDto {
    business_id?: string;
    q?: string;
}
