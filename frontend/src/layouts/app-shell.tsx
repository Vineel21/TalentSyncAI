import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/features/shared/theme-provider';
import { cn, initials } from '@/lib/utils';
import type { UserRole } from '@/types/api';

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  end?: boolean;
}

const candidateNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Find jobs', href: '/jobs', icon: Search },
  { label: 'Applications', href: '/applications', icon: FileText },
  { label: 'Profile', href: '/profile', icon: CircleUserRound },
];

const recruiterNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/recruiter', icon: LayoutDashboard, end: true },
  { label: 'Jobs', href: '/recruiter/jobs', icon: BriefcaseBusiness },
  { label: 'Applicants', href: '/recruiter/applicants', icon: UsersRound },
  { label: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
];

function Navigation({ items, onNavigate }: { items: NavigationItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Workspace navigation" className="space-y-1">
      {items.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-blue-50 text-primary dark:bg-blue-950'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
            )
          }
          end={item.end}
          key={item.href}
          onClick={onNavigate}
          to={item.href}
        >
          <item.icon aria-hidden="true" className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ role }: { role: UserRole }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigation = role === 'candidate' ? candidateNavigation : recruiterNavigation;
  const roleLabel = role === 'candidate' ? 'Candidate workspace' : 'Recruiter workspace';

  return (
    <div className="min-h-dvh min-w-0 overflow-x-clip bg-slate-50 text-foreground transition-colors duration-300 dark:bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card/95 backdrop-blur-xl lg:flex lg:flex-col dark:bg-slate-900/95 dark:border-slate-800">
        <div className="flex h-16 items-center border-b px-6 dark:border-slate-800">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {roleLabel}
          </p>
          <Navigation items={navigation} />
        </div>
        <div className="border-t p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 border dark:bg-slate-800/60 dark:border-slate-700/60">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
              {initials(user?.fullName ?? user?.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.fullName ?? 'TalentSync member'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-dvh w-[min(18rem,calc(100vw-2rem))] overflow-y-auto bg-card p-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <Button
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>
            <Navigation items={navigation} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="hidden text-xs text-muted-foreground sm:block">{roleLabel}</p>
              <p className="truncate text-sm font-semibold">
                Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <Button
              aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
              size="icon"
              variant="ghost"
            >
              {theme === 'light' ? (
                <Moon aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Sun aria-hidden="true" className="h-5 w-5" />
              )}
            </Button>
            <Button asChild aria-label="Notifications" size="icon" variant="ghost">
              <NavLink to="/notifications">
                <Bell aria-hidden="true" className="h-5 w-5" />
              </NavLink>
            </Button>
            <div className="relative">
              <Button
                aria-expanded={accountOpen}
                aria-label="Account menu"
                className="gap-1 px-1 sm:px-2"
                onClick={() => setAccountOpen((value) => !value)}
                variant="ghost"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials(user?.fullName ?? user?.email)}
                </span>
                <ChevronDown aria-hidden="true" className="hidden h-4 w-4 sm:block" />
              </Button>
              {accountOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card p-2 shadow-xl">
                  <div className="border-b px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user?.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
                  </div>
                  {role === 'candidate' ? (
                    <NavLink
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setAccountOpen(false)}
                      to="/profile"
                    >
                      <CircleUserRound aria-hidden="true" className="h-4 w-4" /> Profile
                    </NavLink>
                  ) : null}
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => void logout()}
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1440px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Mobile workspace navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden"
      >
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
            end={item.end}
            key={item.href}
            to={item.href}
          >
            <item.icon aria-hidden="true" className="h-5 w-5" />
            <span className="w-full truncate text-center">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
