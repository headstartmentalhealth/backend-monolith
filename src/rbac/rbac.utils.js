"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRole = exports.filterByRoleGroup = void 0;
var filterByRoleGroup = function (role_group_id) {
    return {
        role_group_id: role_group_id || undefined,
    };
};
exports.filterByRoleGroup = filterByRoleGroup;
var formatRole = function (role_name) {
    return role_name.split(' ').join('_').toLowerCase();
};
exports.formatRole = formatRole;
