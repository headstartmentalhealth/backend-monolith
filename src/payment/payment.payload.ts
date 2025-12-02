import { MeasurementMetadataDto } from '@/generic/generic.dto';
import {
  CouponType,
  EnrollmentStatus,
  ProductType,
  PurchaseType,
  SubscriptionPeriod,
} from '@prisma/client';

export class TransactionSchema {
  user_id: string;
  purchases: any[];
  coupon_id: string;
  coupon_code: string;
  coupon_value: number;
}

export class PurchaseSchema {
  name: string;
  tier_name?: string;
  price: number;
  id: string; // For product tiers e.g ticket tier id etc
  product_id: string; // The actual product id
  quantity: number;
  created_at: Date;
  purchase_type: ProductType;
  interval?: SubscriptionPeriod;
  auto_renew?: boolean;
  metadata?: MeasurementMetadataDto[];
}

export class CompletePurchaseDetailSchema {
  items: PurchaseSchema[]; // Store all purchases inside metadata
  coupon_id: string;
  coupon_code: string;
  coupon_value: number;
  coupon_type: CouponType;
  business_id: string;
  currency?: string;
  payment_id: string;
}
