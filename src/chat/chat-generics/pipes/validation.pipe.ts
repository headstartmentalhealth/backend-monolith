import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  @WebSocketServer() server: Server;

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);

    if (!object) {
      throw new BadRequestException('Validation failed');
    }

    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    } else {
      return value;
    }
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
