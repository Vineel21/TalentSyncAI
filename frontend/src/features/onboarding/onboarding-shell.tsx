import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { OnboardingStepper } from './onboarding-stepper';
import type { OnboardingStep } from '@/types/api';

export function OnboardingShell({
  currentStep,
  onStepSelect,
  children,
}: {
  currentStep: OnboardingStep;
  onStepSelect: (step: OnboardingStep) => void;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-foreground dark:bg-background">
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <Badge className="hidden sm:inline-flex" variant="success">
              Progress saved
            </Badge>
            <Link
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              to="/"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <OnboardingStepper currentStep={currentStep} onStepSelect={onStepSelect} />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-7 pb-28 sm:px-6 sm:py-10 sm:pb-28 lg:px-8">
        {children}
      </div>
    </main>
  );
}
