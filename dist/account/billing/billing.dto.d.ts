export declare class CreateBillingInformationDto {
    address: string;
    state: string;
    city: string;
    apartment?: string;
    postal_code: string;
    country: string;
    selected?: boolean;
}
declare const UpdateBillingInformationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateBillingInformationDto>>;
export declare class UpdateBillingInformationDto extends UpdateBillingInformationDto_base {
}
export {};
