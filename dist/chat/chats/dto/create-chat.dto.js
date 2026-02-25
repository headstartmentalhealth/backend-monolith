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
exports.GroupMember = exports.CreateChatGroupDto = exports.CreateChatNotificationDto = exports.CreateChatDto = exports.CreateChatMessageDto = void 0;
const class_validator_1 = require("class-validator");
const chat_token_dto_1 = require("../../chat-generics/dto/chat-token.dto");
const class_transformer_1 = require("class-transformer");
class CreateChatMessageDto extends chat_token_dto_1.TokenDto {
}
exports.CreateChatMessageDto = CreateChatMessageDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "chatBuddy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "chatGroup", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.file),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.message),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "file", void 0);
class CreateChatDto {
}
exports.CreateChatDto = CreateChatDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "initiator", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "chatBuddy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "chatGroup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "lastMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "lastMessageId", void 0);
class CreateChatNotificationDto {
}
exports.CreateChatNotificationDto = CreateChatNotificationDto;
class CreateChatGroupDto extends chat_token_dto_1.TokenDto {
}
exports.CreateChatGroupDto = CreateChatGroupDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChatGroupDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatGroupDto.prototype, "multimedia_id", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GroupMember),
    __metadata("design:type", Array)
], CreateChatGroupDto.prototype, "members", void 0);
class GroupMember {
}
exports.GroupMember = GroupMember;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GroupMember.prototype, "member_id", void 0);
//# sourceMappingURL=create-chat.dto.js.map