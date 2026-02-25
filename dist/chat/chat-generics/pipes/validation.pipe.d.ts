import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { Server } from 'socket.io';
export declare class ValidationPipe implements PipeTransform<any> {
    server: Server;
    transform(value: any, { metatype }: ArgumentMetadata): Promise<any>;
    private toValidate;
}
