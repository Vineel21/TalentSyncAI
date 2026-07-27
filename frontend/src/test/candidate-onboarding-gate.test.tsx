import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidateOnboardingGate } from '@/features/onboarding/candidate-onboarding-gate';
import { onboardingService } from '@/services/onboarding.service';

vi.mock('@/services/onboarding.service', () => ({
  onboardingService: {
    get: vi.fn(),
  },
}));

function renderGate() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<div>Profile setup</div>} path="/onboarding" />
          <Route element={<CandidateOnboardingGate />}>
            <Route element={<div>Candidate dashboard</div>} path="/dashboard" />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CandidateOnboardingGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects an incomplete candidate to onboarding', async () => {
    vi.mocked(onboardingService.get).mockResolvedValue({
      currentStep: 2,
      source: 'manual',
      completedAt: null,
      recommendationsSkippedAt: null,
    });

    renderGate();

    expect(await screen.findByText('Profile setup')).toBeInTheDocument();
    expect(screen.queryByText('Candidate dashboard')).not.toBeInTheDocument();
  });

  it('renders the requested candidate route after onboarding is complete', async () => {
    vi.mocked(onboardingService.get).mockResolvedValue({
      currentStep: 3,
      source: 'resume',
      completedAt: '2026-07-27T10:00:00.000Z',
      recommendationsSkippedAt: null,
    });

    renderGate();

    expect(await screen.findByText('Candidate dashboard')).toBeInTheDocument();
  });
});
