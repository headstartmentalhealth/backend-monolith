"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Provider = exports.S3_PROVIDER = void 0;
const config_1 = require("@nestjs/config");
const aws_sdk_1 = require("aws-sdk");
exports.S3_PROVIDER = 'S3';
exports.S3Provider = {
    provide: exports.S3_PROVIDER,
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        return new aws_sdk_1.S3({
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
            region: configService.get('AWS_REGION'),
        });
    },
};
//# sourceMappingURL=s3.js.map