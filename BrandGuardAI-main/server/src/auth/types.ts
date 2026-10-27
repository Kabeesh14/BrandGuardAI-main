export type UserRole = 'Content Creator' | 'Reviewer' | 'Administrator';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
