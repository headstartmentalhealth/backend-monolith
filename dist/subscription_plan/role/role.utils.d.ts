import { Role, SubscriptionPlan, SubscriptionPlanRole, User } from '@prisma/client';
export declare const composeRoleID: (title: string) => string;
export type RelatedModels = {
    creator: {
        id: User['id'];
        name: User['name'];
        role: {
            name: Role['name'];
            role_id: Role['role_id'];
        };
    };
    subscription_plan: {
        id: SubscriptionPlan['id'];
        name: SubscriptionPlan['name'];
        business_id: SubscriptionPlan['business_id'];
    };
};
export type RoleSelection = {
    id: SubscriptionPlanRole['id'];
    title: SubscriptionPlanRole['title'];
    role_id: SubscriptionPlanRole['role_id'];
    created_at: SubscriptionPlanRole['created_at'];
};
