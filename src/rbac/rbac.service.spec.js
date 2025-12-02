"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@nestjs/testing");
var rbac_service_1 = require("./rbac.service");
var prisma_service_1 = require("../prisma/prisma.service");
var common_1 = require("@nestjs/common");
var uuid_1 = require("uuid");
var log_service_1 = require("../log/log.service");
var ID = (0, uuid_1.v4)();
describe('RoleGroupService Integration', function () {
    var service;
    var prisma;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [rbac_service_1.RoleGroupService, prisma_service_1.PrismaService, rbac_service_1.RoleService, log_service_1.LogService],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(rbac_service_1.RoleGroupService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Disconnect Prisma after all tests
                return [4 /*yield*/, prisma.$disconnect()];
                case 1:
                    // Disconnect Prisma after all tests
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be defined', function () {
        expect(service).toBeDefined();
    });
    describe('create', function () {
        it('should create a role group', function () { return __awaiter(void 0, void 0, void 0, function () {
            var createRoleDto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRoleDto = {
                            id: ID,
                            name: 'Admin Test - ' + String(Math.random()).split('.')[1],
                        };
                        return [4 /*yield*/, service.create(createRoleDto)];
                    case 1:
                        result = _a.sent();
                        expect(result.statusCode).toEqual(common_1.HttpStatus.CREATED);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('update', function () {
        it('should update a role group', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id, updateRoleGroupDto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = ID;
                        updateRoleGroupDto = {
                            name: 'User Test' + String(Math.random()).split('.')[1],
                        };
                        return [4 /*yield*/, service.update(id, updateRoleGroupDto)];
                    case 1:
                        result = _a.sent();
                        expect(result.statusCode).toEqual(common_1.HttpStatus.OK);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException if role group does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = '1';
                        return [4 /*yield*/, expect(service.update(id, {})).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('get', function () {
        it('should return all role groups (paginated)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var query, roleGroups;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            pagination: { page: 1, limit: 10 },
                        };
                        return [4 /*yield*/, service.fetch(query)];
                    case 1:
                        roleGroups = _a.sent();
                        expect(roleGroups.statusCode).toEqual(common_1.HttpStatus.OK);
                        expect(roleGroups.data).toBeInstanceOf(Array);
                        expect(roleGroups.data.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return a role group', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = ID;
                        return [4 /*yield*/, service.fetchSingle(id)];
                    case 1:
                        result = _a.sent();
                        expect(result.statusCode).toEqual(common_1.HttpStatus.OK);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException if role group does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = '1';
                        return [4 /*yield*/, expect(service.fetchSingle(id)).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('delete', function () {
        it('should delete a role group', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = ID;
                        return [4 /*yield*/, service.delete(id)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, prisma.roleGroup.deleteMany({
                                where: { id: ID },
                            })];
                    case 2:
                        _a.sent();
                        expect(result.statusCode).toEqual(common_1.HttpStatus.OK);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException if role group does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = '1';
                        return [4 /*yield*/, expect(service.delete(id)).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
var ROLE_ID = (0, uuid_1.v4)();
var ROLE_GROUP_ID = (0, uuid_1.v4)();
var ROLE_NAME = 'Administrator Test - ' + String(Math.random()).split('.')[1];
// Mock the request object
var mockRequest = {
    ip: '127.0.0.1',
    headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
    },
    connection: {
        remoteAddress: '127.0.0.1',
    },
};
describe('RoleService Integration', function () {
    var service;
    var prisma;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [rbac_service_1.RoleGroupService, rbac_service_1.RoleService, prisma_service_1.PrismaService, log_service_1.LogService],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(rbac_service_1.RoleService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    return [4 /*yield*/, prisma.roleGroup.create({
                            data: {
                                id: ROLE_GROUP_ID,
                                name: 'Admin Test' + String(Math.random()).split('.')[1],
                            },
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Disconnect Prisma after all tests
                return [4 /*yield*/, prisma.$disconnect()];
                case 1:
                    // Disconnect Prisma after all tests
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('create', function () {
        it('should create a new role', function () { return __awaiter(void 0, void 0, void 0, function () {
            var createRoleDto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRoleDto = {
                            id: ROLE_ID,
                            name: ROLE_NAME,
                            description: 'Administrator role',
                            role_group_id: ROLE_GROUP_ID, // Ensure this is a valid UUID
                        };
                        return [4 /*yield*/, service.create(createRoleDto)];
                    case 1:
                        result = _a.sent();
                        expect(result.statusCode).toBe(201);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw a conflict exception if role name already exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            var createRoleDto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRoleDto = {
                            name: ROLE_NAME,
                            description: 'Administrator role',
                            role_group_id: ROLE_GROUP_ID,
                        };
                        return [4 /*yield*/, expect(service.create(createRoleDto)).rejects.toThrow(common_1.ConflictException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('update', function () {
        it('should update an existing role', function () { return __awaiter(void 0, void 0, void 0, function () {
            var role, updateRoleDto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.role.findFirst({ where: { id: ROLE_ID } })];
                    case 1:
                        role = _a.sent();
                        updateRoleDto = { description: 'Updated description' };
                        return [4 /*yield*/, service.update(ROLE_ID, updateRoleDto)];
                    case 2:
                        result = _a.sent();
                        expect(result.statusCode).toBe(200);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw a not found exception if role does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.update('non-existent-id', { description: 'Test' })).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('fetch', function () {
        it('should fetch roles with pagination', function () { return __awaiter(void 0, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            role_group_id: ROLE_GROUP_ID,
                            pagination: { page: 1, limit: 10 },
                        };
                        return [4 /*yield*/, service.fetch(query)];
                    case 1:
                        result = _a.sent();
                        expect(result.statusCode).toBe(200);
                        expect(result.data).toBeInstanceOf(Array);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('fetchSingle', function () {
        it('should fetch a single role by ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var role, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.role.findFirst({ where: { id: ROLE_ID } })];
                    case 1:
                        role = _a.sent();
                        return [4 /*yield*/, service.fetchSingle(role.id)];
                    case 2:
                        result = _a.sent();
                        expect(result.statusCode).toBe(200);
                        expect(result.data.id).toBe(ROLE_ID);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw a not found exception if role does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.fetchSingle('non-existent-id')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('delete', function () {
        it('should delete an existing role', function () { return __awaiter(void 0, void 0, void 0, function () {
            var role, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.role.findFirst({ where: { id: ROLE_ID } })];
                    case 1:
                        role = _a.sent();
                        return [4 /*yield*/, service.delete(role.id, mockRequest)];
                    case 2:
                        result = _a.sent();
                        // Optionally, clear the role, role groups and logs table by id after running tests
                        return [4 /*yield*/, prisma.role.deleteMany({
                                where: { role_group_id: ROLE_GROUP_ID },
                            })];
                    case 3:
                        // Optionally, clear the role, role groups and logs table by id after running tests
                        _a.sent();
                        return [4 /*yield*/, prisma.roleGroup.deleteMany({
                                where: { id: ROLE_GROUP_ID },
                            })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, prisma.log.deleteMany({
                                where: { entity_id: role.id },
                            })];
                    case 5:
                        _a.sent();
                        expect(result.statusCode).toBe(200);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw a not found exception if role does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.delete('non-existent-id', mockRequest)).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
