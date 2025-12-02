import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { GoogleSSOPayload } from '../../auth.payload';
import { Platform } from '../../sso.dto';

@Injectable()
export class GoogleSSOService {
  private GOOGLE_CLIENT_ID: string;
  private GOOGLE_MOBILE_CLIENT_ID: string;
  private GOOGLE_CLIENT_SECRET: string;

  private google: any;

  constructor(private readonly configService: ConfigService) {
    this.GOOGLE_CLIENT_ID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.GOOGLE_MOBILE_CLIENT_ID = this.configService.get<string>(
      'GOOGLE_MOBILE_CLIENT_ID',
    );

    this.GOOGLE_CLIENT_SECRET = this.configService.get<string>(
      'GOOGLE_CLIENT_SECRET',
    );

    this.google = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  /**
   * Verify ID token
   * @param token
   * @returns
   */
  async verify(token: string, platform?: Platform): Promise<GoogleSSOPayload> {
    try {
      let clientID = this.GOOGLE_CLIENT_ID;

      let profile: any;
      if (platform) {
        if (platform === Platform.MOBILE) {
          // Use access_token to fetch user profile
          const { data } = await axios.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          profile = data;
        }
      } else {
        const ticket = await this.google.verifyIdToken({
          idToken: token,
          audience: clientID,
        });

        profile = ticket.getPayload();

        console.log(1);
      }

      console.log(profile);

      return profile;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Google SSO validation error:', error);
    }
  }
}

@Injectable()
export class GoogleRecaptchaService {
  private google_captcha_secret: string;
  private captcha: string;
  private url: string;
  // const response = await axios.post(url);
  // if (!response.data.success || response.data.success !== true) {
  //   return false;
  // }
  // return true;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.google_captcha_secret = this.configService.get<string>(
      'GOOGLE_RECAPTCHA_SECRET_KEY',
    );
    this.captcha = this.configService.get<string>('GOOGLE_RECAPTCHA_SITE_KEY');
    this.url = `https://www.google.com/recaptcha/api/siteverify?secret=${this.google_captcha_secret}`;
  }

  /**
   * Validate recaptcha
   * @returns
   */
  async validate(captcha: string) {
    try {
      this.url += `&response=${captcha}`;
      // const response = await axios.post(this.url);
      const response = await this.httpService.post(this.url).toPromise();

      console.log(response);
      if (!response.data.success) {
        throw new Error('Recaptcha Validation error');
      }
      return true;
    } catch (error) {
      console.error(error);
      throw new BadRequestException(error.message || 'Something went wrong.');
    }
  }
}
