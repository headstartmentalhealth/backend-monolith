"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCategoryService = void 0;
var prisma_base_repository_1 = require("@/prisma/prisma.base.repository");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var generic_utils_1 = require("@/generic/generic.utils");
var ProductCategoryService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ProductCategoryService = _classThis = /** @class */ (function () {
        function ProductCategoryService_1(prisma, logService, genericService) {
            this.prisma = prisma;
            this.logService = logService;
            this.genericService = genericService;
            this.model = 'ProductCategory';
            this.select = {
                id: true,
                name: true,
                creator_id: true,
                created_at: true,
                updated_at: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        role: { select: { name: true, role_id: true } },
                    }, // Fetch only required user details
                },
            };
            this.productCategoryRepository = new prisma_base_repository_1.PrismaBaseRepository('productCategory', prisma);
        }
        /**
         * Check if Product category name exists (Return error if true)
         * @param name
         * @param business_id
         * @param prisma
         */
        ProductCategoryService_1.prototype.nameExists = function (name, business_id, prisma) {
            return __awaiter(this, void 0, void 0, function () {
                var product_category;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, prisma.productCategory.findUnique({
                                where: { name: name },
                            })];
                        case 1:
                            product_category = _a.sent();
                            // Check if name already exist
                            if (product_category) {
                                throw new common_1.ConflictException('Product category name exists.');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Create product category
         * @param request
         * @param createCategoryDto
         * @returns
         */
        ProductCategoryService_1.prototype.create = function (request, createCategoryDto) {
            return __awaiter(this, void 0, void 0, function () {
                var auth, name;
                var _this = this;
                return __generator(this, function (_a) {
                    auth = request.user;
                    name = createCategoryDto.name;
                    return [2 /*return*/, this.prisma.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            var product_category;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // 2. Name exists
                                    return [4 /*yield*/, this.nameExists(name, request['Business-Id'], prisma)];
                                    case 1:
                                        // 2. Name exists
                                        _a.sent();
                                        return [4 /*yield*/, prisma.productCategory.create({
                                                data: {
                                                    name: name,
                                                    creator: { connect: { id: auth.sub } },
                                                },
                                            })];
                                    case 2:
                                        product_category = _a.sent();
                                        // 4. Create log
                                        return [4 /*yield*/, this.logService.createWithTrx({
                                                user_id: auth.sub,
                                                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                                                entity: this.model,
                                                entity_id: product_category.id,
                                                metadata: "User with ID ".concat(auth.sub, " just created a ticket category ID ").concat(product_category.id),
                                                ip_address: (0, generic_utils_1.getIpAddress)(request),
                                                user_agent: (0, generic_utils_1.getUserAgent)(request),
                                            }, prisma.log)];
                                    case 3:
                                        // 4. Create log
                                        _a.sent();
                                        return [2 /*return*/, {
                                                statusCode: common_1.HttpStatus.CREATED,
                                                message: 'Product category created successfully.',
                                            }];
                                }
                            });
                        }); })];
                });
            });
        };
        /**
         * Fetch product categories
         * @param payload
         * @param filterProductCategoryDto
         * @returns
         */
        ProductCategoryService_1.prototype.fetch = function (payload, filterProductCategoryDto) {
            return __awaiter(this, void 0, void 0, function () {
                var auth, pagination_filters, filters, select, _a, productCategories, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            auth = payload.user;
                            pagination_filters = (0, generic_utils_1.pageFilter)(filterProductCategoryDto);
                            filters = __assign(__assign(__assign({}, (filterProductCategoryDto.q && {
                                name: { contains: filterProductCategoryDto.q, mode: 'insensitive' },
                            })), pagination_filters.filters), { tz: payload.timezone });
                            select = this.select;
                            return [4 /*yield*/, Promise.all([
                                    this.productCategoryRepository.findManyWithPagination(filters, __assign({}, pagination_filters.pagination_options), client_1.Prisma.SortOrder.desc, undefined, select),
                                    this.productCategoryRepository.count(filters),
                                ])];
                        case 1:
                            _a = _b.sent(), productCategories = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    data: productCategories,
                                    count: total,
                                }];
                    }
                });
            });
        };
        /**
         * Fetch single product category
         * @param payload
         * @param param
         * @returns
         */
        ProductCategoryService_1.prototype.fetchSingle = function (payload, param) {
            return __awaiter(this, void 0, void 0, function () {
                var auth, select, filters, productCategory;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            auth = payload.user;
                            select = __assign({}, this.select);
                            filters = {
                                id: param.id,
                            };
                            return [4 /*yield*/, this.productCategoryRepository.findOne(filters, undefined, select)];
                        case 1:
                            productCategory = _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    data: productCategory,
                                }];
                    }
                });
            });
        };
        /**
         * Get a single product category (return error if not found)
         * @param id
         * @returns
         */
        ProductCategoryService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var select, filters, product_category;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            select = this.select;
                            filters = {
                                id: id,
                            };
                            return [4 /*yield*/, this.productCategoryRepository.findOne(filters, undefined, select)];
                        case 1:
                            product_category = _a.sent();
                            if (!product_category) {
                                throw new common_1.NotFoundException("Product category not found.");
                            }
                            return [2 /*return*/, product_category];
                    }
                });
            });
        };
        /**
         * Update product category
         * @param request
         * @param param
         * @param updateProductCategoryDto
         * @returns
         */
        ProductCategoryService_1.prototype.update = function (request, param, updateProductCategoryDto) {
            return __awaiter(this, void 0, void 0, function () {
                var auth, id, name;
                var _this = this;
                return __generator(this, function (_a) {
                    auth = request.user;
                    id = param.id;
                    name = updateProductCategoryDto.name;
                    return [2 /*return*/, this.prisma.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            var existing_product_category;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.findOne(id)];
                                    case 1:
                                        existing_product_category = _a.sent();
                                        // 3. Update product category
                                        return [4 /*yield*/, prisma.productCategory.update({
                                                where: { id: id },
                                                data: __assign({}, updateProductCategoryDto),
                                            })];
                                    case 2:
                                        // 3. Update product category
                                        _a.sent();
                                        // 3. Create log
                                        return [4 /*yield*/, this.logService.createWithTrx({
                                                user_id: auth.sub,
                                                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                                                entity: this.model,
                                                entity_id: existing_product_category.id,
                                                metadata: "User with ID ".concat(auth.sub, " just updated a product category ID ").concat(existing_product_category.id, "."),
                                                ip_address: (0, generic_utils_1.getIpAddress)(request),
                                                user_agent: (0, generic_utils_1.getUserAgent)(request),
                                            }, prisma.log)];
                                    case 3:
                                        // 3. Create log
                                        _a.sent();
                                        return [2 /*return*/, {
                                                statusCode: common_1.HttpStatus.OK,
                                                message: 'Product category updated successfully.',
                                            }];
                                }
                            });
                        }); })];
                });
            });
        };
        /**
         * Delete product category
         * @param request
         * @param param
         */
        ProductCategoryService_1.prototype.delete = function (request, param) {
            return __awaiter(this, void 0, void 0, function () {
                var auth, id;
                var _this = this;
                return __generator(this, function (_a) {
                    auth = request.user;
                    id = param.id;
                    return [2 /*return*/, this.prisma.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            var existing_product_category;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.findOne(id)];
                                    case 1:
                                        existing_product_category = _a.sent();
                                        // 4. Validate that there are no related models - TODO
                                        // 5. Soft delete product category
                                        return [4 /*yield*/, prisma.productCategory.update({
                                                where: { id: existing_product_category.id },
                                                data: {
                                                    name: (0, generic_utils_1.deletionRename)(existing_product_category.name),
                                                    deleted_at: new Date(),
                                                },
                                            })];
                                    case 2:
                                        // 4. Validate that there are no related models - TODO
                                        // 5. Soft delete product category
                                        _a.sent();
                                        // 6. Create log
                                        return [4 /*yield*/, this.logService.createWithTrx({
                                                user_id: auth.sub,
                                                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                                                entity: this.model,
                                                entity_id: existing_product_category.id,
                                                metadata: "User with ID ".concat(auth.sub, " just deleted a product category ID ").concat(existing_product_category.id, "."),
                                                ip_address: (0, generic_utils_1.getIpAddress)(request),
                                                user_agent: (0, generic_utils_1.getUserAgent)(request),
                                            }, prisma.log)];
                                    case 3:
                                        // 6. Create log
                                        _a.sent();
                                        return [2 /*return*/, {
                                                statusCode: common_1.HttpStatus.OK,
                                                message: 'Product category deleted successfully.',
                                            }];
                                }
                            });
                        }); })];
                });
            });
        };
        /**
         * Validate that model has related records
         * @param product_category_id
         */
        ProductCategoryService_1.prototype.hasRelatedRecords = function (product_category_id) {
            return __awaiter(this, void 0, void 0, function () {
                var relatedTables, _i, relatedTables_1, _a, model, field, count;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            relatedTables = [{ model: null, field: 'product_category_id' }];
                            _i = 0, relatedTables_1 = relatedTables;
                            _c.label = 1;
                        case 1:
                            if (!(_i < relatedTables_1.length)) return [3 /*break*/, 4];
                            _a = relatedTables_1[_i], model = _a.model, field = _a.field;
                            return [4 /*yield*/, model.count({
                                    where: (_b = {}, _b[field] = product_category_id, _b),
                                })];
                        case 2:
                            count = _c.sent();
                            if (count > 0) {
                                throw new common_1.ForbiddenException('Related records for this model exists.'); // Related records exist
                            }
                            _c.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return ProductCategoryService_1;
    }());
    __setFunctionName(_classThis, "ProductCategoryService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductCategoryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductCategoryService = _classThis;
}();
exports.ProductCategoryService = ProductCategoryService;
