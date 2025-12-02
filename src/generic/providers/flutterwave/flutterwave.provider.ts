import { ConfigService } from '@nestjs/config';
import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { FlutterwaveTransactionResponse } from './flutterwave.utils';

@Injectable()
export class FlutterwaveService {
  private secretKey: string;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    this.baseUrl = this.configService.get<string>('FLUTTERWAVE_BASE_URL');
  }

  async initializePayment(payload: {
    amount: number;
    email: string;
    tx_ref: string;
    currency?: string;
    redirect_url?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: payload.tx_ref,
          amount: payload.amount,
          currency: payload.currency || 'NGN',
          redirect_url:
            payload.redirect_url || 'http://localhost:3000/redirect',
          customer: { email: payload.email },
          payment_options: 'card,ussd,banktransfer',
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (err) {
      throw new HttpException(err.response?.data || err.message, 400);
    }
  }

  async verifyPayment(
    transactionId: string,
  ): Promise<FlutterwaveTransactionResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (err) {
      console.log(err);

      throw new HttpException(err.response?.data || err.message, 400);
    }
  }
}
