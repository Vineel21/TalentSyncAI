import { createContext, useContext } from 'react';
import type { LoginInput, RegisterInput } from '@/services/auth.service';
import type { User } from '@/types/api';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<{ user: User; requiresVerification: boolean }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
