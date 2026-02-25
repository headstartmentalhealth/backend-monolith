"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
let WsExceptionFilter = class WsExceptionFilter extends websockets_1.BaseWsExceptionFilter {
    catch(exception, host) {
        const client = host.switchToWs().getClient();
        const data = host.switchToWs().getData();
        const error = exception.getError();
        let errorResponse;
        if (typeof error === 'string') {
            errorResponse = {
                error,
                message: error,
                statusCode: 400,
            };
        }
        else if (error && typeof error === 'object') {
            const errorObj = error;
            errorResponse = {
                error: errorObj.error || 'Internal server error',
                message: errorObj.message || 'An error occurred',
                details: errorObj.details,
                statusCode: errorObj.statusCode || 500,
            };
        }
        else {
            errorResponse = {
                error: 'Internal server error',
                message: 'An error occurred',
                statusCode: 500,
            };
        }
        const details = {
            type: 'error',
            timestamp: new Date().toISOString(),
            event: data?.event || 'unknown',
            ...errorResponse,
        };
        client.emit('error', details);
        console.error('WebSocket Error:', {
            clientId: client.id,
            error: details,
            originalError: exception,
        });
    }
};
exports.WsExceptionFilter = WsExceptionFilter;
exports.WsExceptionFilter = WsExceptionFilter = __decorate([
    (0, common_1.Catch)(websockets_1.WsException)
], WsExceptionFilter);
//# sourceMappingURL=ws-exception.filter.js.map