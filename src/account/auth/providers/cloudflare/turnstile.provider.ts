// src/auth/turnstile.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TurnstileService {
  constructor(private readonly configService: ConfigService) {}

  async validateToken(token: string, remoteip?: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Missing Turnstile token');
    }

    try {
      const url = this.configService.get<string>('CLOUDFLARE_TURNSTILE_URL');
      const response = await axios.post(
        url,
        new URLSearchParams({
          secret: this.configService.get<string>('CLOUDFLARE_SECRET_KEY'),
          response: token,
          remoteip: remoteip || '',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const data = response.data;

      if (!data.success) {
        throw new BadRequestException('Invalid Turnstile token');
      }
    } catch (error) {
      throw new BadRequestException('Turnstile validation failed');
    }
  }
}
