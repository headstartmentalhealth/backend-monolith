"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveGroupChatDto = exports.GroupMemberDto = exports.UpdateGroupChatDto = exports.UpdateChatMessageDto = void 0;
const class_validator_1 = require("class-validator");
const chat_token_dto_1 = require("../../chat-generics/dto/chat-token.dto");
const class_transformer_1 = require("class-transformer");
class UpdateChatMessageDto extends chat_token_dto_1.TokenDto {
}
exports.UpdateChatMessageDto = UpdateChatMessageDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateChatMessageDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChatMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateChatMessageDto.prototype, "read", void 0);
class UpdateGroupChatDto extends chat_token_dto_1.TokenDto {
}
exports.UpdateGroupChatDto = UpdateGroupChatDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupChatDto.prototype, "group_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGroupChatDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGroupChatDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateGroupChatDto.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GroupMemberDto),
    __metadata("design:type", Array)
], UpdateGroupChatDto.prototype, "members", void 0);
class GroupMemberDto {
    constructor() {
        this.is_admin = false;
    }
}
exports.GroupMemberDto = GroupMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GroupMemberDto.prototype, "member_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GroupMemberDto.prototype, "is_admin", void 0);
class LeaveGroupChatDto extends chat_token_dto_1.TokenDto {
}
exports.LeaveGroupChatDto = LeaveGroupChatDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LeaveGroupChatDto.prototype, "group_id", void 0);
//# sourceMappingURL=update-chat.dto.js.map