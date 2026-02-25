import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GoogleSSOPayload } from '../../auth.payload';
import { Platform } from '../../sso.dto';
export declare class GoogleSSOService {
    private readonly configService;
    private GOOGLE_CLIENT_ID;
    private GOOGLE_MOBILE_CLIENT_ID;
    private GOOGLE_CLIENT_SECRET;
    private google;
    constructor(configService: ConfigService);
    verify(token: string, platform?: Platform): Promise<GoogleSSOPayload>;
}
export declare class GoogleRecaptchaService {
    private readonly httpService;
    private readonly configService;
    private google_captcha_secret;
    private captcha;
    private url;
    constructor(httpService: HttpService, configService: ConfigService);
    validate(captcha: string): Promise<boolean>;
}
