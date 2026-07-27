import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  const home = user?.role === 'recruiter' ? '/recruiter' : user ? '/dashboard' : '/';
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <div className="max-w-lg text-center">
        <Logo className="justify-center text-xl" />
        <div className="mx-auto mt-12 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-blue-300">
          <Compass aria-hidden="true" className="h-8 w-8" />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">This page wandered off.</h1>
        <p className="mt-4 leading-7 text-slate-400">
          The link may be outdated, or you may not have access to this workspace.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link className="flex items-center gap-2" to={home}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Return to {user ? 'dashboard' : 'home'}
          </Link>
        </Button>
      </div>
    </main>
  );
}
