import { BusinessInformation, Coupon, Role, User } from '@prisma/client';

export type RelatedModels = {
  creator: {
    id: User['id'];
    name: User['name'];
    role: { name: Role['name']; role_id: Role['role_id'] };
  };
  business: {
    id: BusinessInformation['id'];
    business_name: BusinessInformation['business_name'];
    user_id: BusinessInformation['user_id'];
  };
};

export type CouponSelection = {
  id: Coupon['id'];
  code: Coupon['code'];
  type: Coupon['type'];
  value: Coupon['value'];
  start_date: Coupon['start_date'];
  end_date: Coupon['end_date'];
  usage_limit: Coupon['usage_limit'];
  user_limit: Coupon['user_limit'];
  min_purchase: Coupon['min_purchase'];
  is_active: Coupon['is_active'];
  created_at: Coupon['created_at'];
};
