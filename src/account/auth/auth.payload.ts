import { Role } from '@/generic/generic.data';

export class LoginPayload {
  statusCode: number;
  message: string;
  accessToken: string;
  data: {
    role: Role;
  };
}

export interface GoogleSSOPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  verified_email: boolean;
  nbf: number;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthDataPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
}
