import { PriceSelection, RelatedModels } from '@/subscription_plan/price/price.utils';
import { Subscription } from '@prisma/client';
export declare const calculateProratedAmount: (currentSubscription: Subscription, newPlanPrice: PriceSelection & RelatedModels) => number;
