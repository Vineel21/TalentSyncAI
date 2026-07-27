import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/auth-provider';
import { useAuth } from '@/features/auth/auth-context';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

function SessionProbe() {
  const { user, isBootstrapping } = useAuth();
  return <div>{isBootstrapping ? 'Restoring' : (user?.email ?? 'Signed out')}</div>;
}

describe('AuthProvider', () => {
  it('restores a cookie-backed session at startup without persisting the access token', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com', role: 'candidate' },
      accessToken: 'memory-token',
    });
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    expect(screen.getByText('Restoring')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('member@example.com')).toBeInTheDocument());
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('settles into a signed-out state when refresh fails', async () => {
    vi.mocked(authService.refresh).mockRejectedValue(new Error('No session'));
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
  });
});
