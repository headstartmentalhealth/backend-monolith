"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeRoleID = void 0;
const composeRoleID = (title) => {
    const hyphenated_title = title.split(' ').join('-').toLowerCase();
    return hyphenated_title;
};
exports.composeRoleID = composeRoleID;
//# sourceMappingURL=role.utils.js.map