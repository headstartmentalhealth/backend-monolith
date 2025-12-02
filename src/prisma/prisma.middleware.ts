import { toTimezone } from '../generic/generic.utils';
import { Prisma } from '@prisma/client';

export function base() {
  // @ts-ignore
  return async (params: Prisma.MiddlewareParams, next: any) => {
    // Extract the timezone from the request metadata
    const tz = params.args?.where?.tz || 'Africa/Lagos'; // Default to Africa/Lagos if not provided

    // Remove the `tz` field from the query arguments to avoid Prisma errors
    if (params.args?.where?.tz) {
      delete params.args.where.tz;
    }

    // Ensure records with deleted_at as null are fetched
    if (params.action.startsWith('find')) {
      params.args.where = {
        ...params.args.where,
        ...(!params.args.where?.deleted_at && { deleted_at: null }),
      };
    }

    if (params.action.startsWith('findMany')) {
      // Handle pagination args (skip, take, cursor)
      const paginationArgs = ['skip', 'take', 'cursor'];
      const pagination = paginationArgs.reduce((acc, arg) => {
        if (params.args[arg]) {
          acc[arg] = params.args[arg];
        }
        return acc;
      }, {});

      // Set default values for skip, take, and orderBy
      const defaultPagination = {
        skip: 0, // Default skip is 0
        // take: 10, // Default take is 10
        ...(!params.args.orderBy && {
          orderBy: {
            updated_at: Prisma.SortOrder.desc, // Default orderBy is created_at: desc
          },
        }),
      };

      // Merge default pagination with the current query arguments
      params.args = {
        ...params.args,
        ...defaultPagination,
        ...pagination, // Ensure pagination args (if any) are preserved
      };
    }

    const result = await next(params);

    // Convert 'created_at', 'updated_at', 'expires_at' and any field that includes 'date' to ${tz} when fetching
    if (
      params.action.startsWith('find') &&
      params.action.startsWith('findMany') &&
      result
    ) {
      const convertDates = (item: any) => {
        if (item.created_at) item.created_at = toTimezone(item.created_at, tz);
        if (item.updated_at) item.updated_at = toTimezone(item.updated_at, tz);
        if (item.expires_at) item.expires_at = toTimezone(item.expires_at, tz);

        // Apply for any field that includes 'date'
        for (const key in item) {
          if (item.hasOwnProperty(key) && key.toLowerCase().includes('date')) {
            item[key] = toTimezone(item[key], tz);
          }
        }
      };

      if (Array.isArray(result)) {
        result.forEach(convertDates);
      } else {
        convertDates(result);
      }
    }

    return result;
  };
}
