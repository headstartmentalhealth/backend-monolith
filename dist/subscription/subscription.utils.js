"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProratedAmount = void 0;
const calculateProratedAmount = (currentSubscription, newPlanPrice) => {
    const now = new Date();
    const timeUsed = (now.getTime() - new Date(currentSubscription.start_date).getTime()) /
        (1000 * 60 * 60 * 24);
    const totalTime = (new Date(currentSubscription.end_date).getTime() -
        new Date(currentSubscription.start_date).getTime()) /
        (1000 * 60 * 60 * 24);
    const unusedAmount = Math.round((+currentSubscription.plan_price_at_subscription * (totalTime - timeUsed)) /
        totalTime);
    return +newPlanPrice.price - unusedAmount;
};
exports.calculateProratedAmount = calculateProratedAmount;
//# sourceMappingURL=subscription.utils.js.map