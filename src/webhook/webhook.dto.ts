import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class PaystackWebhookDto {
  @IsNotEmpty()
  @IsString()
  event: string; // Event type (e.g., "charge.success")

  @IsNotEmpty()
  @IsObject()
  data: {
    id: string; // Transaction ID
    reference: string; // Payment reference
    status: string; // Payment status (e.g., "success")
    amount: number; // Amount in kobo
    metadata: {
      payment_id?: string; // Custom metadata (e.g., payment ID)
      user_id?: string; // Custom metadata (e.g., user ID)
      plan_id?: string; // Custom metadata (e.g., subscription plan ID)
    };
    authorization: {
      authorization_code: string; // Paystack authorization code
      card_type: string; // Card type (e.g., "visa")
      last4: string; // Last 4 digits of the card
      exp_month: string; // Expiration month
      exp_year: string; // Expiration year
      channel: string; // Payment channel (e.g., "card")
      bank: string; // Bank name (if applicable)
    };
    customer: {
      email: string; // Customer email
      first_name: string; // Customer first name
      last_name: string; // Customer last name
    };
  };

  @IsOptional()
  @IsObject()
  plan?: {
    id: string; // Plan ID
    name: string; // Plan name
    amount: number; // Plan amount
  };

  @IsOptional()
  @IsObject()
  subscription?: {
    id: string; // Subscription ID
    status: string; // Subscription status
  };
}
