"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCategoryController = void 0;
var common_1 = require("@nestjs/common");
var role_decorator_1 = require("@/account/auth/decorators/role.decorator");
var generic_data_1 = require("@/generic/generic.data");
var ProductCategoryController = function () {
    var _classDecorators = [(0, common_1.Controller)('v1/product-category')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _fetch_decorators;
    var _fetchSingle_decorators;
    var _update_decorators;
    var _delete_decorators;
    var ProductCategoryController = _classThis = /** @class */ (function () {
        function ProductCategoryController_1(productCategoryService) {
            this.productCategoryService = (__runInitializers(this, _instanceExtraInitializers), productCategoryService);
        }
        /**
         * Create product category
         * @param request
         * @param createProductCategoryDto
         * @returns
         */
        ProductCategoryController_1.prototype.create = function (request, createProductCategoryDto) {
            return this.productCategoryService.create(request, createProductCategoryDto);
        };
        /**
         * Fetch product categories
         * @param request
         * @param queryDto
         * @returns
         */
        ProductCategoryController_1.prototype.fetch = function (request, filterProductCategoryDto) {
            return this.productCategoryService.fetch(request, filterProductCategoryDto);
        };
        /**
         * Fetch single product category
         * @param request
         * @param param
         * @returns
         */
        ProductCategoryController_1.prototype.fetchSingle = function (request, param) {
            return this.productCategoryService.fetchSingle(request, param);
        };
        /**
         * Update a product category
         * @param request
         * @param param
         * @param updateProductCategoryDto
         * @returns
         */
        ProductCategoryController_1.prototype.update = function (request, param, updateProductCategoryDto) {
            return this.productCategoryService.update(request, param, updateProductCategoryDto);
        };
        /**
         * Delete a product category
         * @param request
         * @param param
         * @returns
         */
        ProductCategoryController_1.prototype.delete = function (request, param) {
            return this.productCategoryService.delete(request, param);
        };
        return ProductCategoryController_1;
    }());
    __setFunctionName(_classThis, "ProductCategoryController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)('create'), (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN)];
        _fetch_decorators = [(0, common_1.Get)()];
        _fetchSingle_decorators = [(0, common_1.Get)(':id'), (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN)];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN)];
        _delete_decorators = [(0, common_1.Delete)(':id'), (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN)];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _fetch_decorators, { kind: "method", name: "fetch", static: false, private: false, access: { has: function (obj) { return "fetch" in obj; }, get: function (obj) { return obj.fetch; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _fetchSingle_decorators, { kind: "method", name: "fetchSingle", static: false, private: false, access: { has: function (obj) { return "fetchSingle" in obj; }, get: function (obj) { return obj.fetchSingle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: function (obj) { return "delete" in obj; }, get: function (obj) { return obj.delete; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductCategoryController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductCategoryController = _classThis;
}();
exports.ProductCategoryController = ProductCategoryController;
