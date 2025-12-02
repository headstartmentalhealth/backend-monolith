import {
  PriceSelection,
  RelatedModels,
} from '@/subscription_plan/price/price.utils';
import { Subscription } from '@prisma/client';

export const calculateProratedAmount = (
  currentSubscription: Subscription,
  newPlanPrice: PriceSelection & RelatedModels,
): number => {
  const now = new Date();
  const timeUsed =
    (now.getTime() - new Date(currentSubscription.start_date).getTime()) /
    (1000 * 60 * 60 * 24); // Time used in days
  const totalTime =
    (new Date(currentSubscription.end_date).getTime() -
      new Date(currentSubscription.start_date).getTime()) /
    (1000 * 60 * 60 * 24); // Total time in days

  const unusedAmount = Math.round(
    (+currentSubscription.plan_price_at_subscription * (totalTime - timeUsed)) /
      totalTime,
  );

  return +newPlanPrice.price - unusedAmount;
};
