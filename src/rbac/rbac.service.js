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
exports.RoleService = exports.RoleGroupService = void 0;
var common_1 = require("@nestjs/common");
var prisma_base_repository_1 = require("../prisma/prisma.base.repository");
var client_1 = require("@prisma/client");
var generic_utils_1 = require("../generic/generic.utils");
var rbac_utils_1 = require("./rbac.utils");
var RoleGroupService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RoleGroupService = _classThis = /** @class */ (function () {
        function RoleGroupService_1(prisma) {
            this.prisma = prisma;
            this.roleGroupRepository = new prisma_base_repository_1.PrismaBaseRepository('roleGroup', prisma);
        }
        /**
         * Create role group
         * @param createRoleDto
         * @returns
         */
        RoleGroupService_1.prototype.create = function (createRoleDto) {
            return __awaiter(this, void 0, void 0, function () {
                var name, role_group;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            name = createRoleDto.name;
                            return [4 /*yield*/, this.roleGroupRepository.findOne({ name: name })];
                        case 1:
                            role_group = _a.sent();
                            // Check if role group exists
                            if (role_group) {
                                throw new common_1.ConflictException('Role group exists.');
                            }
                            return [4 /*yield*/, this.roleGroupRepository.create(createRoleDto)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.CREATED,
                                    message: 'Role group created successfully.',
                                }];
                    }
                });
            });
        };
        /**
         * Update role group
         * @param id
         * @param updateRoleGroupDto
         * @returns
         */
        RoleGroupService_1.prototype.update = function (id, updateRoleGroupDto) {
            return __awaiter(this, void 0, void 0, function () {
                var role_group;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.roleGroupRepository.findOne({ id: id })];
                        case 1:
                            role_group = _a.sent();
                            if (!role_group) {
                                throw new common_1.NotFoundException('Role group not found');
                            }
                            return [4 /*yield*/, this.roleGroupRepository.update({ id: id }, updateRoleGroupDto)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role group updated successfully',
                                }];
                    }
                });
            });
        };
        /**
         * Get role groups (Paginated)
         * @returns
         */
        RoleGroupService_1.prototype.fetch = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var pagination, role_groups, total;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pagination = query.pagination;
                            return [4 /*yield*/, this.roleGroupRepository.findManyWithPagination({}, {
                                    page: +(pagination === null || pagination === void 0 ? void 0 : pagination.page) || generic_utils_1.PAGINATION.PAGE,
                                    limit: +(pagination === null || pagination === void 0 ? void 0 : pagination.limit) || generic_utils_1.PAGINATION.LIMIT,
                                })];
                        case 1:
                            role_groups = _a.sent();
                            return [4 /*yield*/, this.roleGroupRepository.count({})];
                        case 2:
                            total = _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role groups data retrieved successfully.',
                                    data: role_groups,
                                    count: total,
                                }];
                    }
                });
            });
        };
        /**
         * Get role group
         * @param id
         * @returns
         */
        RoleGroupService_1.prototype.fetchSingle = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var role_group;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.roleGroupRepository.findOne({
                                id: id,
                            })];
                        case 1:
                            role_group = _a.sent();
                            if (!role_group) {
                                throw new common_1.NotFoundException('Role group not found');
                            }
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role group data retrieved successfully.',
                                    data: role_group,
                                }];
                    }
                });
            });
        };
        /**
         * Validate that model has related records
         * @param role_group_id
         */
        RoleGroupService_1.prototype.hasRelatedRecords = function (role_group_id) {
            return __awaiter(this, void 0, void 0, function () {
                var relatedTables, _i, relatedTables_1, _a, model, field, count;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            relatedTables = [{ model: this.prisma.role, field: 'role_group_id' }];
                            _i = 0, relatedTables_1 = relatedTables;
                            _c.label = 1;
                        case 1:
                            if (!(_i < relatedTables_1.length)) return [3 /*break*/, 4];
                            _a = relatedTables_1[_i], model = _a.model, field = _a.field;
                            return [4 /*yield*/, model.count({
                                    where: (_b = {}, _b[field] = role_group_id, _b),
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
        /**
         * Delete role group
         * @param id
         * @returns
         */
        RoleGroupService_1.prototype.delete = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var role_group;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.roleGroupRepository.findOne({
                                id: id,
                            })];
                        case 1:
                            role_group = _a.sent();
                            if (!role_group) {
                                throw new common_1.NotFoundException('Role group not found');
                            }
                            // Validate that there are no related models
                            return [4 /*yield*/, this.hasRelatedRecords(role_group.id)];
                        case 2:
                            // Validate that there are no related models
                            _a.sent();
                            return [4 /*yield*/, this.roleGroupRepository.delete({ id: id })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role group deleted successfully.',
                                }];
                    }
                });
            });
        };
        return RoleGroupService_1;
    }());
    __setFunctionName(_classThis, "RoleGroupService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RoleGroupService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RoleGroupService = _classThis;
}();
exports.RoleGroupService = RoleGroupService;
var RoleService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RoleService = _classThis = /** @class */ (function () {
        function RoleService_1(prisma, roleGroupService, logService) {
            this.prisma = prisma;
            this.roleGroupService = roleGroupService;
            this.logService = logService;
            this.roleRepository = new prisma_base_repository_1.PrismaBaseRepository('role', prisma);
        }
        /**
         * Create a new role
         * @param createRoleDto
         * @returns
         */
        RoleService_1.prototype.create = function (createRoleDto) {
            return __awaiter(this, void 0, void 0, function () {
                var name, role_group_id, existingRole, role_id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            name = createRoleDto.name, role_group_id = createRoleDto.role_group_id;
                            // Validate role group id
                            return [4 /*yield*/, this.roleGroupService.fetchSingle(role_group_id)];
                        case 1:
                            // Validate role group id
                            _a.sent();
                            return [4 /*yield*/, this.roleRepository.findOne({ name: name })];
                        case 2:
                            existingRole = _a.sent();
                            if (existingRole) {
                                throw new common_1.ConflictException('Role name already exists.');
                            }
                            role_id = (0, rbac_utils_1.formatRole)(name);
                            return [4 /*yield*/, this.roleRepository.create(__assign(__assign({}, createRoleDto), { role_id: role_id }))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.CREATED,
                                    message: 'Role created successfully.',
                                }];
                    }
                });
            });
        };
        /**
         * Update role
         * @param id
         * @param updateRoleDto
         * @returns
         */
        RoleService_1.prototype.update = function (id, updateRoleDto) {
            return __awaiter(this, void 0, void 0, function () {
                var name, role, existingRole;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            name = updateRoleDto.name;
                            return [4 /*yield*/, this.roleRepository.findOne({ id: id })];
                        case 1:
                            role = _a.sent();
                            if (!role) {
                                throw new common_1.NotFoundException('Role not found');
                            }
                            if (!(name && name !== role.name)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.roleRepository.findOne({ name: name })];
                        case 2:
                            existingRole = _a.sent();
                            if (existingRole) {
                                throw new common_1.ConflictException('Role name already exists.');
                            }
                            _a.label = 3;
                        case 3: return [4 /*yield*/, this.roleRepository.update({ id: id }, updateRoleDto)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role updated successfully',
                                }];
                    }
                });
            });
        };
        /**
         * Fetch roles (Paginated)
         * @param query
         * @returns
         */
        RoleService_1.prototype.fetch = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var pagination, role_group_id, filter, include, roles, total;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pagination = query.pagination, role_group_id = query.role_group_id;
                            if (!role_group_id) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.roleGroupService.fetchSingle(role_group_id)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            filter = (0, rbac_utils_1.filterByRoleGroup)(role_group_id);
                            include = {
                                role_group: true,
                            };
                            return [4 /*yield*/, this.roleRepository.findManyWithPagination(filter, {
                                    page: +(pagination === null || pagination === void 0 ? void 0 : pagination.page) || generic_utils_1.PAGINATION.PAGE,
                                    limit: +(pagination === null || pagination === void 0 ? void 0 : pagination.limit) || generic_utils_1.PAGINATION.LIMIT,
                                }, client_1.Prisma.SortOrder.desc, include)];
                        case 3:
                            roles = _a.sent();
                            return [4 /*yield*/, this.roleRepository.count(filter)];
                        case 4:
                            total = _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Roles retrieved successfully',
                                    data: roles,
                                    count: total,
                                }];
                    }
                });
            });
        };
        /**
         * Fetch a single role
         * @param id
         * @returns
         */
        RoleService_1.prototype.fetchSingle = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var include, role;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            include = { role_group: true };
                            return [4 /*yield*/, this.roleRepository.findOne({ id: id }, include)];
                        case 1:
                            role = _a.sent();
                            if (!role) {
                                throw new common_1.NotFoundException('Role not found');
                            }
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role retrieved successfully',
                                    data: role,
                                }];
                    }
                });
            });
        };
        /**
         * Fetch a single role_id
         * @param role_id
         * @returns
         */
        RoleService_1.prototype.fetchOne = function (role_id) {
            return __awaiter(this, void 0, void 0, function () {
                var include, role;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            include = { role_group: true };
                            return [4 /*yield*/, this.roleRepository.findOne({ role_id: role_id }, include)];
                        case 1:
                            role = _a.sent();
                            if (!role) {
                                throw new common_1.NotFoundException('Role not found');
                            }
                            return [2 /*return*/, role];
                    }
                });
            });
        };
        /**
         * Validate that model has related records
         * @param subscription_plan_id
         */
        RoleService_1.prototype.hasRelatedRecords = function (role_identity) {
            return __awaiter(this, void 0, void 0, function () {
                var relatedTables, _i, relatedTables_2, _a, model, field, count;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            relatedTables = [{ model: this.prisma.user, field: 'role_identity' }];
                            _i = 0, relatedTables_2 = relatedTables;
                            _c.label = 1;
                        case 1:
                            if (!(_i < relatedTables_2.length)) return [3 /*break*/, 4];
                            _a = relatedTables_2[_i], model = _a.model, field = _a.field;
                            return [4 /*yield*/, model.count({
                                    where: (_b = {}, _b[field] = role_identity, _b),
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
        /**
         * Delete a role
         * @param id
         * @returns
         */
        RoleService_1.prototype.delete = function (id, request) {
            return __awaiter(this, void 0, void 0, function () {
                var role, ipAddress, userAgent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.roleRepository.findOne({ id: id })];
                        case 1:
                            role = _a.sent();
                            if (!role) {
                                throw new common_1.NotFoundException('Role not found');
                            }
                            // Validate that there are no related models
                            return [4 /*yield*/, this.hasRelatedRecords(role.id)];
                        case 2:
                            // Validate that there are no related models
                            _a.sent();
                            return [4 /*yield*/, this.roleRepository.delete({ id: id })];
                        case 3:
                            _a.sent();
                            ipAddress = (0, generic_utils_1.getIpAddress)(request);
                            userAgent = (0, generic_utils_1.getUserAgent)(request);
                            // Log the deletion action
                            return [4 /*yield*/, this.logService.createLog({
                                    action: 'DELETE',
                                    entity: 'Role',
                                    entity_id: id,
                                    ip_address: ipAddress,
                                    user_agent: userAgent,
                                    metadata: "Role ID ".concat(role.id, " has just been deleted"),
                                })];
                        case 4:
                            // Log the deletion action
                            _a.sent();
                            return [2 /*return*/, {
                                    statusCode: common_1.HttpStatus.OK,
                                    message: 'Role deleted successfully',
                                }];
                    }
                });
            });
        };
        return RoleService_1;
    }());
    __setFunctionName(_classThis, "RoleService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RoleService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RoleService = _classThis;
}();
exports.RoleService = RoleService;
