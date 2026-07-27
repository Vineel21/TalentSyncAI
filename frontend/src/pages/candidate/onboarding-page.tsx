import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { onboardingQueryKey } from '@/features/onboarding/candidate-onboarding-gate';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import { DataExtractionStep } from '@/features/onboarding/steps/data-extraction-step';
import {
  onboardingRecommendationsQueryKey,
  RecommendationsStep,
} from '@/features/onboarding/steps/recommendations-step';
import { useToast } from '@/features/shared/toast-provider';
import { savedJobsQueryKey } from '@/features/saved-jobs/saved-jobs';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';
import { CandidateProfileEditor } from '@/pages/candidate/profile-page';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingSource, OnboardingStep } from '@/types/api';

function FullPageStatus({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-background">
      {error ? (
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-bold">We couldn’t load profile setup</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{errorMessage(error)}</p>
          <Button className="mt-5" onClick={onRetry} variant="outline">
            Try again
          </Button>
        </Card>
      ) : (
        <div
          aria-label="Loading profile setup"
          className="flex flex-col items-center gap-5"
          role="status"
        >
          <Logo />
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your saved progress…</p>
        </div>
      )}
    </main>
  );
}

export function OnboardingPage() {
  useDocumentTitle('Set up your profile');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const onboarding = useQuery({
    queryKey: onboardingQueryKey,
    queryFn: onboardingService.get,
  });
  const progress = useMutation({
    mutationFn: onboardingService.updateProgress,
    onSuccess: (data) => queryClient.setQueryData(onboardingQueryKey, data),
    onError: (error) => toast.error('Progress wasn’t saved', errorMessage(error)),
  });
  const complete = useMutation({
    mutationFn: onboardingService.complete,
    onSuccess: async (data) => {
      queryClient.setQueryData(onboardingQueryKey, data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'candidate'] }),
        queryClient.invalidateQueries({ queryKey: savedJobsQueryKey }),
      ]);
      navigate('/dashboard?welcome=1', { replace: true });
    },
    onError: (error) => toast.error('Setup couldn’t be completed', errorMessage(error)),
  });

  useEffect(() => {
    if (!onboarding.data || onboarding.data.completedAt) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [onboarding.data]);

  if (onboarding.isLoading) return <FullPageStatus />;
  if (onboarding.isError || !onboarding.data) {
    return <FullPageStatus error={onboarding.error} onRetry={() => void onboarding.refetch()} />;
  }
  if (onboarding.data.completedAt) return <Navigate replace to="/dashboard" />;

  const currentStep = onboarding.data.currentStep;

  async function changeStep(step: OnboardingStep, source?: OnboardingSource) {
    await progress.mutateAsync({ step, source });
  }

  return (
    <OnboardingShell
      currentStep={currentStep}
      onStepSelect={(step) => {
        if (step !== currentStep) void changeStep(step);
      }}
    >
      {currentStep === 1 ? (
        <DataExtractionStep
          currentSource={onboarding.data.source}
          isAdvancing={progress.isPending}
          onContinue={(source) => changeStep(2, source)}
        />
      ) : null}
      {currentStep === 2 ? (
        <CandidateProfileEditor
          onboarding
          onBack={() => void changeStep(1)}
          onSaved={async () => {
            await queryClient.invalidateQueries({
              queryKey: onboardingRecommendationsQueryKey,
            });
            await changeStep(3);
          }}
        />
      ) : null}
      {currentStep === 3 ? (
        <RecommendationsStep
          isCompleting={complete.isPending}
          onBack={() => void changeStep(2)}
          onComplete={(skipped) => complete.mutate(skipped)}
        />
      ) : null}
    </OnboardingShell>
  );
}
