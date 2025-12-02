import { Role } from './generic.data';

export class GenericPayload {
  statusCode: number;
  message: string;
}

export class GenericPayloadAlias<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export class GenericDataPayload<T> {
  statusCode: number;
  data: T;
}

export class PagePayload<T> {
  statusCode?: number;
  message?: string;
  data: Array<T>;
  userId?: string;
  count: number;
  unread_count?: number;
}

export class AltPagePayload<T> {
  statusCode?: number;
  data: T;
  count: number;
}

export class TotalPayload {
  total?: number;
  active?: number;
  drafts?: number;
  cancelled?: number;
  inactive?: number;
  pending?: number;
}

export class Timezone {
  timezone: string;
}

export class AuthPayload extends Timezone {
  user: {
    sub: string;
    email: string;
    name: string;
    role: Role;
  };
  'Business-Id'?: string;
}

export class PaginationFiltersPayload {
  filters: {
    created_at: {
      gte: Date;
      lte: Date;
    };
  };
  pagination_options: {
    page: number;
    limit: number;
  };
}
