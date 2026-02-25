import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
export declare const S3_PROVIDER = "S3";
export declare const S3Provider: {
    provide: string;
    inject: (typeof ConfigService)[];
    useFactory: (configService: ConfigService) => S3;
};
