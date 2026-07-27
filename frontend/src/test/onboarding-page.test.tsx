import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/features/shared/toast-provider';
import { OnboardingPage } from '@/pages/candidate/onboarding-page';
import { onboardingService } from '@/services/onboarding.service';
import { savedJobService } from '@/services/saved-job.service';
import type { CandidateOnboarding } from '@/types/api';

vi.mock('@/services/onboarding.service', () => ({
  onboardingService: {
    get: vi.fn(),
    updateProgress: vi.fn(),
    recommendations: vi.fn(),
    complete: vi.fn(),
  },
}));

vi.mock('@/services/saved-job.service', () => ({
  savedJobService: {
    list: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/pages/candidate/profile-page', () => ({
  CandidateProfileEditor: ({
    onBack,
    onSaved,
  }: {
    onBack?: () => void;
    onSaved?: () => void | Promise<void>;
  }) => (
    <div>
      <p>Complete profile editor</p>
      <button onClick={onBack} type="button">
        Back to import
      </button>
      <button onClick={() => void onSaved?.()} type="button">
        Save profile and continue
      </button>
    </div>
  ),
}));

const state = (step: 1 | 2 | 3): CandidateOnboarding => ({
  currentStep: step,
  source: 'manual',
  completedAt: null,
  recommendationsSkippedAt: null,
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <ToastProvider>
          <Routes>
            <Route element={<OnboardingPage />} path="/onboarding" />
            <Route element={<div>Candidate dashboard</div>} path="/dashboard" />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OnboardingPage progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onboardingService.recommendations).mockResolvedValue([]);
    vi.mocked(savedJobService.list).mockResolvedValue([]);
    vi.mocked(onboardingService.updateProgress).mockImplementation(async ({ step, source }) => ({
      ...state(step),
      source: source ?? 'manual',
    }));
    vi.mocked(onboardingService.complete).mockImplementation(async (skipped) => ({
      ...state(3),
      completedAt: '2026-07-27T10:00:00.000Z',
      recommendationsSkippedAt: skipped ? '2026-07-27T10:00:00.000Z' : null,
    }));
  });

  it('moves from profile refinement to recommendations and supports Back', async () => {
    const user = userEvent.setup();
    vi.mocked(onboardingService.get).mockResolvedValue(state(2));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Save profile and continue' }));
    expect(await screen.findByText('Roles selected for your profile')).toBeInTheDocument();
    expect(onboardingService.updateProgress).toHaveBeenCalledWith({ step: 3, source: undefined });

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Complete profile editor')).toBeInTheDocument();
    expect(onboardingService.updateProgress).toHaveBeenCalledWith({ step: 2, source: undefined });
  });

  it('can skip recommendations and transitions to the dashboard', async () => {
    const user = userEvent.setup();
    vi.mocked(onboardingService.get).mockResolvedValue(state(3));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Skip for now' }));

    await waitFor(() => expect(onboardingService.complete).toHaveBeenCalledWith(true));
    expect(await screen.findByText('Candidate dashboard')).toBeInTheDocument();
  });
});
