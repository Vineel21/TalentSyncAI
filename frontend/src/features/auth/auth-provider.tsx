import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/query-client';
import { setApiAccessToken, setRefreshSessionHandler } from '@/lib/api-client';
import { authService, type LoginInput, type RegisterInput } from '@/services/auth.service';
import type { User } from '@/types/api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setApiAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const session = await authService.refresh();
      setApiAccessToken(session.accessToken);
      setUser(session.accessToken ? session.user : null);
      return session.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let isActive = true;
    setRefreshSessionHandler(refresh);

    async function restoreSession() {
      try {
        const session = await authService.refresh();
        if (!isActive) return;
        setApiAccessToken(session.accessToken);
        setUser(session.accessToken ? session.user : null);
      } catch {
        if (isActive) clearSession();
      } finally {
        if (isActive) setIsBootstrapping(false);
      }
    }

    void restoreSession();
    return () => {
      isActive = false;
      setRefreshSessionHandler(null);
    };
  }, [clearSession, refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const session = await authService.login(input);
    if (!session.accessToken) {
      throw new Error('Your account must be verified before signing in.');
    }
    setApiAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await authService.register(input);
    setApiAccessToken(session.accessToken);
    setUser(session.accessToken ? session.user : null);
    return {
      user: session.user,
      requiresVerification: !session.accessToken,
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [user, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
