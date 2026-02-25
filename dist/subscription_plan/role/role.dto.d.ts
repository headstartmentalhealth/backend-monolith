export declare class CreateSubscriptionPlanRoleDto {
    subscription_plan_id: string;
    title: string;
}
declare const UpdateSubscriptionPlanRoleDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSubscriptionPlanRoleDto>>;
export declare class UpdateSubscriptionPlanRoleDto extends UpdateSubscriptionPlanRoleDto_base {
    selected: boolean;
}
export {};
