export declare class CreateModuleDto {
    course_id: string;
    title: string;
    position: number;
}
export declare class UpdateModuleDto {
    title?: string;
    position?: number;
}
declare class ModulePositionDto {
    id: string;
    position: number;
}
export declare class RearrangeModulesDto {
    modules: ModulePositionDto[];
}
export declare class CreateModuleContentDto {
    title: string;
    position: number;
    multimedia_id: string;
}
export declare class CreateModuleWithContentsDto {
    title: string;
    position: number;
    course_id: string;
    contents: CreateModuleContentDto[];
}
export declare class CreateMultipleModulesDto {
    modules: CreateModuleWithContentsDto[];
}
export declare class UpdateModuleContentDto {
    id?: string;
    title: string;
    position: number;
    multimedia_id: string;
}
export declare class UpdateModuleBulkDto {
    id: string;
    title: string;
    position: number;
    course_id: string;
    contents: UpdateModuleContentDto[];
}
export declare class BulkUpdateModulesDto {
    modules: UpdateModuleBulkDto[];
}
export declare class CourseIdDto {
    course_id: string;
}
export {};
