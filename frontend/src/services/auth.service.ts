import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, AuthPayload, User } from '@/types/api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  role: 'candidate' | 'recruiter';
}

export const authService = {
  async login(input: LoginInput) {
    return getData((await api.post<ApiResponse<AuthPayload>>('/auth/login', input)).data);
  },
  async register(input: RegisterInput) {
    return getData((await api.post<ApiResponse<AuthPayload>>('/auth/register', input)).data);
  },
  async refresh() {
    return getData((await api.post<ApiResponse<AuthPayload>>('/auth/refresh')).data);
  },
  async me() {
    return getData((await api.get<ApiResponse<{ user: User }>>('/auth/me')).data).user;
  },
  async logout() {
    return getData((await api.post<ApiResponse<null>>('/auth/logout')).data);
  },
};
