"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Authorization, Business-Id',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        disableErrorMessages: false,
        whitelist: true,
    }));
    app.use((0, express_1.json)({ limit: '500mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '500mb' }));
    const server = app.getHttpServer();
    server.setTimeout(10 * 60 * 1000);
    await app.listen(4002);
}
bootstrap();
//# sourceMappingURL=main.js.map