import { Role, SubscriptionPlan, SubscriptionPlanPrice, User } from '@prisma/client';
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
export type PriceSelection = {
    id: SubscriptionPlanPrice['id'];
    price: SubscriptionPlanPrice['price'];
    period: SubscriptionPlanPrice['period'];
    created_at: SubscriptionPlanPrice['created_at'];
};
