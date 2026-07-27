import type { UserRow, UserRole } from '../../config/database.types.js';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthData {
  user: PublicUser;
  accessToken: string | null;
}

export interface AuthSessionResult {
  user: PublicUser;
  accessToken: string | null;
  refreshToken: string | null;
}

export const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
});
