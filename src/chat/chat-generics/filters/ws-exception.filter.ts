import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface WsErrorResponse {
  error?: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    const error = exception.getError();

    let errorResponse: WsErrorResponse;

    if (typeof error === 'string') {
      errorResponse = {
        error,
        message: error,
        statusCode: 400,
      };
    } else if (error && typeof error === 'object') {
      const errorObj = error as WsErrorResponse;
      errorResponse = {
        error: errorObj.error || 'Internal server error',
        message: errorObj.message || 'An error occurred',
        details: errorObj.details,
        statusCode: errorObj.statusCode || 500,
      };
    } else {
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

    // Emit error back to the client
    client.emit('error', details);

    // Log the error for debugging
    console.error('WebSocket Error:', {
      clientId: client.id,
      error: details,
      originalError: exception,
    });
  }
}
