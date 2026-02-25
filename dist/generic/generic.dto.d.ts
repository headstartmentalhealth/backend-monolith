import { Decimal } from '@prisma/client/runtime/library';
import { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare class IdDto {
    id: string;
}
export declare class TypeDto {
    type: string;
}
export declare class IdDtoAlias {
    id: string;
}
export declare class UniqueColumnConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean>;
}
export declare class Pagination {
    limit: number;
    page: number;
}
export declare class QueryDto {
    startDate?: string;
    endDate?: string;
    pagination: Pagination;
}
export declare class EmailDto {
    email: string;
}
export declare class TZ {
    tz: string;
}
export declare class BusinessDto {
    business_id: string;
}
export declare class UserDto {
    user_id: string;
}
export declare enum ChartType {
    PIE_CHART = "pie-chart",
    BAR_CHART = "bar-chart"
}
export declare class ChartDto {
    chart_type: ChartType;
}
export declare class CurrencyDto {
    currency: string;
}
export declare class MeasurementMetadataDto {
    customer_name?: string;
    unit?: string;
    bust_circumference?: Decimal;
    shoulder_width?: Decimal;
    armhole_circumference?: Decimal;
    sleeve_length?: Decimal;
    bicep_circumference?: Decimal;
    wrist_circumference?: Decimal;
    waist_circumference?: Decimal;
    hip_circumference?: Decimal;
    thigh_circumference?: Decimal;
    knee_circumference?: Decimal;
    trouser_length?: Decimal;
    height?: Decimal;
    dress_length?: Decimal;
}
