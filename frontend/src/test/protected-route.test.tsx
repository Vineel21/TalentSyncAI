import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/features/auth/auth-context';
import { ProtectedRoute } from '@/routes/protected-route';

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const sessionActions = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

function renderProtected(
  initialPath = '/private',
  roles: Array<'candidate' | 'recruiter'> = ['candidate'],
) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<div>Sign in page</div>} path="/login" />
        <Route element={<div>Candidate dashboard</div>} path="/dashboard" />
        <Route element={<div>Recruiter dashboard</div>} path="/recruiter" />
        <Route element={<ProtectedRoute roles={roles} />}>
          <Route element={<div>Private content</div>} path="/private" />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects signed-out users to login', () => {
    mockedUseAuth.mockReturnValue({
      ...sessionActions,
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
    renderProtected();
    expect(screen.getByText('Sign in page')).toBeInTheDocument();
  });

  it('renders content for an allowed role', () => {
    mockedUseAuth.mockReturnValue({
      ...sessionActions,
      user: { id: 'candidate-1', email: 'candidate@example.com', role: 'candidate' },
      isAuthenticated: true,
      isBootstrapping: false,
    });
    renderProtected();
    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('returns a recruiter to their own dashboard when a role is denied', () => {
    mockedUseAuth.mockReturnValue({
      ...sessionActions,
      user: { id: 'recruiter-1', email: 'recruiter@example.com', role: 'recruiter' },
      isAuthenticated: true,
      isBootstrapping: false,
    });
    renderProtected();
    expect(screen.getByText('Recruiter dashboard')).toBeInTheDocument();
  });
});
