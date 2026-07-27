import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/features/auth/auth-context';
import type { UserRole } from '@/types/api';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <main
        aria-label="Restoring your session"
        className="grid min-h-screen place-items-center bg-slate-950 text-white"
      >
        <div className="flex flex-col items-center gap-5">
          <Logo className="text-xl" />
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-500" />
          </div>
          <p className="text-sm text-slate-400">Restoring your workspace…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to={user.role === 'recruiter' ? '/recruiter' : '/dashboard'} />;
  }

  return <Outlet />;
}
