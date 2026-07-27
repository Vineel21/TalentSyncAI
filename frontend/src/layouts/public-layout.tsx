import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/features/shared/theme-provider';

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dashboardPath = user?.role === 'recruiter' ? '/recruiter' : '/dashboard';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              href="/#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              href="/#how-it-works"
            >
              How it works
            </a>
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              href="/#jobs"
            >
              Jobs
            </a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button
              aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
              size="icon"
              variant="ghost"
            >
              {theme === 'light' ? (
                <Moon aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Sun aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
            {user ? (
              <Button asChild>
                <Link to={dashboardPath}>Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
          <Button
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            size="icon"
            variant="ghost"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
        {open ? (
          <nav
            aria-label="Mobile navigation"
            className="container space-y-2 border-t py-4 md:hidden"
          >
            {[
              ['Features', '/#features'],
              ['How it works', '/#how-it-works'],
              ['Jobs', '/#jobs'],
            ].map(([label, href]) => (
              <a
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                href={href}
                key={label}
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          </nav>
        ) : null}
      </header>
      <Outlet />
      <footer className="border-t bg-slate-950 text-slate-300">
        <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo className="text-white" />
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
              Smarter matching, faster applications, and more human hiring—powered by responsible
              AI.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Product</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <a className="block hover:text-white" href="/#features">
                Features
              </a>
              <Link className="block hover:text-white" to="/jobs">
                Browse jobs
              </Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Account</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <Link className="block hover:text-white" to="/login">
                Sign in
              </Link>
              <Link className="block hover:text-white" to="/register">
                Create account
              </Link>
            </div>
          </div>
        </div>
        <div className="container border-t border-white/10 py-6 text-xs text-slate-500">
          © {new Date().getFullYear()} TalentSync AI. Built for better hiring.
        </div>
      </footer>
    </div>
  );
}
