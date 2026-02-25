"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModule = void 0;
const common_1 = require("@nestjs/common");
const ticket_module_1 = require("./ticket/ticket.module");
const course_module_1 = require("./course/course.module");
const category_module_1 = require("./category/category.module");
const general_module_1 = require("./general/general.module");
const digital_product_module_1 = require("./digital-product/digital-product.module");
const physical_product_module_1 = require("./physical-product/physical-product.module");
let ProductModule = class ProductModule {
};
exports.ProductModule = ProductModule;
exports.ProductModule = ProductModule = __decorate([
    (0, common_1.Module)({
        imports: [
            category_module_1.CategoryModule,
            course_module_1.CourseModule,
            ticket_module_1.TicketModule,
            general_module_1.GeneralModule,
            digital_product_module_1.DigitalProductModule,
            physical_product_module_1.PhysicalProductModule,
        ],
    })
], ProductModule);
//# sourceMappingURL=product.module.js.map