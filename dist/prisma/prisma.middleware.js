"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base = base;
const generic_utils_1 = require("../generic/generic.utils");
const client_1 = require("@prisma/client");
function base() {
    return async (params, next) => {
        const tz = params.args?.where?.tz || 'Africa/Lagos';
        if (params.args?.where?.tz) {
            delete params.args.where.tz;
        }
        if (params.action.startsWith('find')) {
            params.args.where = {
                ...params.args.where,
                ...(!params.args.where?.deleted_at && { deleted_at: null }),
            };
        }
        if (params.action.startsWith('findMany')) {
            const paginationArgs = ['skip', 'take', 'cursor'];
            const pagination = paginationArgs.reduce((acc, arg) => {
                if (params.args[arg]) {
                    acc[arg] = params.args[arg];
                }
                return acc;
            }, {});
            const defaultPagination = {
                skip: 0,
                ...(!params.args.orderBy && {
                    orderBy: {
                        updated_at: client_1.Prisma.SortOrder.desc,
                    },
                }),
            };
            params.args = {
                ...params.args,
                ...defaultPagination,
                ...pagination,
            };
        }
        const result = await next(params);
        if (params.action.startsWith('find') &&
            params.action.startsWith('findMany') &&
            result) {
            const convertDates = (item) => {
                if (item.created_at)
                    item.created_at = (0, generic_utils_1.toTimezone)(item.created_at, tz);
                if (item.updated_at)
                    item.updated_at = (0, generic_utils_1.toTimezone)(item.updated_at, tz);
                if (item.expires_at)
                    item.expires_at = (0, generic_utils_1.toTimezone)(item.expires_at, tz);
                for (const key in item) {
                    if (item.hasOwnProperty(key) && key.toLowerCase().includes('date')) {
                        item[key] = (0, generic_utils_1.toTimezone)(item[key], tz);
                    }
                }
            };
            if (Array.isArray(result)) {
                result.forEach(convertDates);
            }
            else {
                convertDates(result);
            }
        }
        return result;
    };
}
//# sourceMappingURL=prisma.middleware.js.map