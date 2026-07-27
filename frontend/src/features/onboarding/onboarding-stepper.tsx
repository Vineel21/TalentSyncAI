import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from '@/types/api';

const steps = [
  { step: 1 as const, label: 'Import profile', shortLabel: 'Import' },
  { step: 2 as const, label: 'Review details', shortLabel: 'Review' },
  { step: 3 as const, label: 'Job matches', shortLabel: 'Matches' },
];

export function OnboardingStepper({
  currentStep,
  onStepSelect,
}: {
  currentStep: OnboardingStep;
  onStepSelect: (step: OnboardingStep) => void;
}) {
  return (
    <nav aria-label="Profile setup progress">
      <p className="mb-3 text-sm font-semibold text-muted-foreground sm:hidden">
        Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label ?? 'Profile setup'}
      </p>
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {steps.map(({ step, label, shortLabel }) => {
          const complete = step < currentStep;
          const active = step === currentStep;
          const available = step <= currentStep;

          return (
            <li className="relative" key={step}>
              <button
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'group flex w-full min-w-0 items-center gap-2 rounded-xl px-1 py-2 text-left focus-visible:ring-2 focus-visible:ring-primary sm:px-2',
                  available ? 'cursor-pointer' : 'cursor-default',
                )}
                disabled={!available}
                onClick={() => onStepSelect(step)}
                type="button"
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition',
                    active && 'border-primary bg-primary text-primary-foreground',
                    complete && 'border-emerald-600 bg-emerald-600 text-white',
                    !active && !complete && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : step}
                </span>
                <span
                  className={cn(
                    'truncate text-xs font-semibold sm:text-sm',
                    active || complete ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
              {step < steps.length ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[calc(100%-0.25rem)] top-6 hidden h-px w-4 -translate-x-1/2 sm:block',
                    complete ? 'bg-emerald-500' : 'bg-border',
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
