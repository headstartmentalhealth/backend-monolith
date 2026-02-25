"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReadinessPercent = void 0;
const getReadinessPercent = (total_contents) => {
    let percent = 15;
    if (total_contents === 1) {
        percent = 30;
    }
    else if (total_contents === 2) {
        percent = 45;
    }
    else if (total_contents === 3) {
        percent = 60;
    }
    else if (total_contents === 4) {
        percent = 75;
    }
    else if (total_contents >= 5) {
        percent = 100;
    }
    return percent;
};
exports.getReadinessPercent = getReadinessPercent;
//# sourceMappingURL=module.utils.js.map