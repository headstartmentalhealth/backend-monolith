import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

export const S3_PROVIDER = 'S3';

export const S3Provider = {
  provide: S3_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new S3({
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: configService.get<string>('AWS_REGION'),
    });
  },
};
