import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { errorMessage } from '@/lib/utils';
import { onboardingService } from '@/services/onboarding.service';

export const onboardingQueryKey = ['onboarding', 'candidate'] as const;

export function CandidateOnboardingGate({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const onboarding = useQuery({
    queryKey: onboardingQueryKey,
    queryFn: onboardingService.get,
  });

  if (onboarding.isLoading) {
    return (
      <main
        aria-label="Checking profile setup"
        className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white"
        role="status"
      >
        <div className="flex flex-col items-center gap-5">
          <Logo className="text-xl" />
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-500" />
          </div>
          <p className="text-sm text-slate-400">Checking your profile setup…</p>
        </div>
      </main>
    );
  }

  if (onboarding.isError || !onboarding.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-bold">We couldn’t check your profile setup</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage(onboarding.error)}
          </p>
          <Button className="mt-5" onClick={() => void onboarding.refetch()} variant="outline">
            Try again
          </Button>
        </Card>
      </main>
    );
  }

  if (!onboarding.data.completedAt) {
    return <Navigate replace state={{ from: location }} to="/onboarding" />;
  }

  return children ?? <Outlet />;
}
