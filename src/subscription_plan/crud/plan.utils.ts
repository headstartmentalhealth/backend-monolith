import { Product, Role, SubscriptionPlan, User } from '@prisma/client';

export type RelatedModels = {
  creator: {
    id: User['id'];
    name: User['name'];
    role: { name: Role['name']; role_id: Role['role_id'] };
  };
  product: Product;
};

export type PlanSelection = {
  id: SubscriptionPlan['id'];
  name: SubscriptionPlan['name'];
  description: SubscriptionPlan['description'];
  cover_image: SubscriptionPlan['cover_image'];
  business_id: SubscriptionPlan['business_id'];
  created_at: SubscriptionPlan['created_at'];
};
