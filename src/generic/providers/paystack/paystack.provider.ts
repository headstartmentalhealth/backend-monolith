import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import axios from 'axios';

export interface IInitialize {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface IVerify {
  id: number;
  domain: string;
  status: string;
  reference: string;
  receipt_number: string | null;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string | null;
  log: {
    start_time: number;
    time_spent: number;
    attempts: number;
    errors: number;
    success: boolean;
    mobile: boolean;
    input: any[];
    history: {
      type: string;
      message: string;
      time: number;
    }[];
  };
  fees: number;
  fees_split: any | null;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  };
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: any | null;
    risk_action: string;
    international_format_phone: string | null;
  };
  plan: any | null;
  split: Record<string, any>;
  order_id: string | null;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: any | null;
  source: any | null;
  fees_breakdown: any | null;
  connect: any | null;
  transaction_date: string;
  plan_object: Record<string, any>;
  subaccount: Record<string, any>;
}

export interface ITrx<T> {
  status: boolean;
  data: T;
}

@Injectable()
export class PaystackService {
  private PAYSTACK_SECRET_KEY: string;
  private headers: { Authorization: string; 'Content-Type': string };

  constructor(private readonly configService: ConfigService) {
    this.PAYSTACK_SECRET_KEY = this.configService.get<string>(
      'PAYSTACK_SECRET_KEY',
    );
    this.headers = {
      Authorization: `Bearer ${this.configService.get<string>(
        'PAYSTACK_SECRET_KEY',
      )}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize a transaction
   * @param data
   * @see https://paystack.com/docs/api/transaction/#initialize
   */
  async initializeTransaction(data: {
    email: string;
    amount: number;
    metadata?: any;
  }): Promise<ITrx<IInitialize>> {
    try {
      const payload = {
        email: data.email,
        amount: data.amount * 100, // Paystack expects amount in kobo (1 NGN = 100 kobo)
        metadata: data.metadata,
      };

      const response = await axios({
        url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/initialize`,
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      });

      console.log(response);

      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(error.response.data.message);
    }
  }

  /**
   * Verify a transaction
   * @see https://paystack.com/docs/api/transaction/#verify
   */
  async verifyTransaction(reference: string): Promise<ITrx<IVerify>> {
    try {
      const response = await axios({
        url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(error.response.data.message);
    }
  }

  /**
   * Resolve account number with Paystack's Bank Verification API
   * @param accountNumber
   * @param bankCode
   * @see https://paystack.com/docs/api/bank-verification
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    try {
      const response = await axios({
        url: `${this.configService.get('PAYSTACK_BASE_URL')}/transferrecipient`,
        method: 'POST',
        data: {
          // type: 'nuban',
          account_number: accountNumber,
          bank_code: bankCode,
          // currency: 'NGN',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      });

      if (response.data.status) {
        return response.data;
      }

      throw new BadRequestException('Account number could not be resolved.');
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Account resolution failed',
      );
    }
  }

  /**
   * Charge authorization
   * @param email
   * @param amount
   * @param authorizationCode
   * @returns
   */
  async chargeAuthorization(
    email: string,
    amount: number,
    authorizationCode: string,
  ): Promise<PaymentRecordResponse> {
    try {
      const response = await axios.post(
        `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/charge_authorization`,
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo
          authorization_code: authorizationCode,
        },
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(error.response?.data?.message);
    }
  }

  /**
   * Fetch banks
   * @returns
   */
  async getBanks(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.configService.get('PAYSTACK_BASE_URL')}/bank`,
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
          },
          params: {
            country: 'nigeria',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || 'Failed to fetch banks',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTransferRecipient(data: {
    type: 'nuban'; // always nuban for NGN
    name: string;
    account_number: string;
    bank_code: string;
    currency: 'NGN';
  }): Promise<{ recipient_code: string }> {
    try {
      const response = await axios.post(
        `${this.configService.get('PAYSTACK_BASE_URL')}/transferrecipient`,
        {
          ...data,
        },
        { headers: this.headers },
      );

      if (!response.data.status) {
        throw new BadRequestException(
          response.data.message || 'Failed to create transfer recipient',
        );
      }

      return response.data.data; // Contains recipient_code, name, details
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message ||
          'Paystack error while creating transfer recipient',
      );
    }
  }

  async initiateTransfer(data: {
    amount: number;
    recipient_code: string;
    reason?: string;
    currency?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.configService.get('PAYSTACK_BASE_URL')}/transfer`,
        {
          source: 'balance',
          amount: data.amount * 100, // Paystack expects kobo
          recipient: data.recipient_code,
          reason: data.reason || 'Withdrawal',
          currency: data.currency || 'NGN',
        },
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error?.response?.data?.message);
    }
  }

  async finalizeTransfer(transfer_code: string, otp: string) {
    try {
      const response = await axios.post(
        `${this.configService.get('PAYSTACK_BASE_URL')}/transfer/finalize_transfer`,
        {
          transfer_code: transfer_code,
          otp: otp,
        },
        {
          headers: this.headers,
        },
      );

      return response.data;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error?.response?.data?.message);
    }
  }

  async verifyTransfer(reference: string) {
    try {
      const response = await axios.get(
        `${this.configService.get('PAYSTACK_BASE_URL')}/transfer/verify/${reference}`,
        {
          headers: this.headers,
        },
      );

      return response.data;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error?.response?.data?.message);
    }
  }
}
