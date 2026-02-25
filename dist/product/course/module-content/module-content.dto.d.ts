export declare class CreateModuleContentDto {
    title: string;
    module_id: string;
    multimedia_id: string;
    position: number;
}
export declare class UpdateModuleContentDto {
    title?: string;
    multimedia_id?: string;
}
declare class ModuleContentPositionDto {
    id: string;
    position: number;
}
export declare class RearrangeModuleContentsDto {
    contents: ModuleContentPositionDto[];
}
export {};
