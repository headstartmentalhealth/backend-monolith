import { Role } from '@/generic/generic.data';
export declare enum Platform {
    WEB = "web",
    MOBILE = "mobile"
}
export declare enum SigninOption {
    INTERNAL = "INTERNAL",
    GOOGLE = "GOOGLE",
    APPLE = "APPLE"
}
export declare enum SigninOptionProvider {
    GOOGLE = "GOOGLE",
    APPLE = "APPLE"
}
export declare enum OnboardActionType {
    SIGNUP = "SIGNUP",
    SIGNIN = "SIGNIN"
}
export declare class SSODto {
    token: string;
    provider: SigninOptionProvider;
    platform: Platform;
    role: Role;
    action_type: OnboardActionType;
}
export declare enum PlatformTypes {
    IOS = "ios",
    ANDROID = "android",
    WEB = "web"
}
export declare class AppleSSODto {
    code: string;
    firstName: string;
    lastName: string;
    platform?: PlatformTypes;
}
