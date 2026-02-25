import { QueryDto } from '../generic/generic.dto';
export declare class CreateRoleGroupDto {
    name: string;
    description?: string;
}
export declare class CreateRoleDto {
    name: string;
    description?: string;
    role_group_id: string;
}
export declare class RoleQueryDto extends QueryDto {
    role_group_id?: string;
}
