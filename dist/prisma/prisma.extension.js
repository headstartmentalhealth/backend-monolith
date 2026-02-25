"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseExtension = void 0;
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../generic/generic.utils");
exports.baseExtension = client_1.Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const anyArgs = args;
                    const tz = anyArgs?.where?.tz || 'Africa/Lagos';
                    if (anyArgs?.where?.tz) {
                        delete anyArgs.where.tz;
                    }
                    if (['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        if (anyArgs.where) {
                            if (anyArgs.where.deleted_at === undefined) {
                                anyArgs.where.deleted_at = null;
                            }
                        }
                        else {
                            anyArgs.where = { deleted_at: null };
                        }
                    }
                    if (operation === 'findMany') {
                        if (anyArgs.skip === undefined) {
                            anyArgs.skip = 0;
                        }
                        if (anyArgs.orderBy === undefined) {
                            anyArgs.orderBy = {
                                updated_at: 'desc',
                            };
                        }
                    }
                    const result = await query(args);
                    if (operation.startsWith('find') && result) {
                        const convertDates = (item) => {
                            if (!item || typeof item !== 'object')
                                return;
                            if (item.created_at)
                                item.created_at = (0, generic_utils_1.toTimezone)(item.created_at, tz);
                            if (item.updated_at)
                                item.updated_at = (0, generic_utils_1.toTimezone)(item.updated_at, tz);
                            if (item.expires_at)
                                item.expires_at = (0, generic_utils_1.toTimezone)(item.expires_at, tz);
                            for (const key in item) {
                                if (Object.prototype.hasOwnProperty.call(item, key) && key.toLowerCase().includes('date')) {
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
                },
            },
        },
    });
});
//# sourceMappingURL=prisma.extension.js.map