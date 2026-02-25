"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = require("firebase-admin");
const path = require("path");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(path.join('./firebase-admin-sdk.json')),
});
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.provider.js.map