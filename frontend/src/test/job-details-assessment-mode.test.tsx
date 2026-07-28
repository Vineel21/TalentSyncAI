import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/features/shared/toast-provider';
import { JobDetailsPage } from '@/pages/candidate/job-details-page';
import { aiService } from '@/services/ai.service';
import { jobService } from '@/services/job.service';
import type { Job } from '@/types/api';

vi.mock('@/config/ai-processing', () => ({
  assessmentModeMessage:
    'Live AI processing is disabled in this assessment deployment. No newly uploaded resume or profile data is sent to Gemini. Use manual profile entry; seeded demo accounts retain their prepared AI results.',
  isLiveAiProcessingEnabled: () => false,
}));

vi.mock('@/services/ai.service', () => ({
  aiService: {
    candidateMatchScore: vi.fn(),
  },
}));

vi.mock('@/services/application.service', () => ({
  applicationService: {
    create: vi.fn(),
  },
}));

vi.mock('@/services/job.service', () => ({
  jobService: {
    get: vi.fn(),
  },
}));

const job: Job = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  title: 'Frontend Engineer',
  companyName: 'TalentSync Labs',
  location: 'Hyderabad, India',
  employmentType: 'full_time',
  description: 'Build accessible candidate experiences.',
  requirements: 'React and TypeScript experience.',
  requiredSkills: ['React', 'TypeScript'],
  status: 'open',
  expiresAt: '2026-08-31T00:00:00.000Z',
  createdAt: '2026-07-20T10:00:00.000Z',
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/jobs/job-1']}>
        <ToastProvider>
          <Routes>
            <Route element={<JobDetailsPage />} path="/jobs/:id" />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('JobDetailsPage assessment mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobService.get).mockResolvedValue(job);
  });

  it('shows safe-mode guidance and prevents a live candidate match request', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText(/Live match checks are paused/i)).toBeInTheDocument();
    expect(
      screen.getByText(/review stored match results from their Applications page/i),
    ).toBeInTheDocument();

    const matchControl = screen.queryByRole('button', { name: /match/i });
    if (matchControl) expect(matchControl).toBeDisabled();

    expect(aiService.candidateMatchScore).not.toHaveBeenCalled();
  });
});
