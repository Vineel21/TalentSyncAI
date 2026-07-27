import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveJobButton, useSavedJobs } from '@/features/saved-jobs/saved-jobs';
import { ToastProvider } from '@/features/shared/toast-provider';
import { savedJobService } from '@/services/saved-job.service';
import type { Job } from '@/types/api';

vi.mock('@/services/saved-job.service', () => ({
  savedJobService: {
    list: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  },
}));

const job: Job = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  title: 'Frontend Engineer',
  companyName: 'TalentSync',
  location: 'Remote',
  employmentType: 'full_time',
  description: 'Build thoughtful candidate experiences.',
  requirements: 'React and TypeScript',
  requiredSkills: ['React', 'TypeScript'],
  status: 'open',
  createdAt: '2026-07-20T10:00:00.000Z',
};

function Harness() {
  const savedJobs = useSavedJobs();
  return <SaveJobButton job={job} savedJobs={savedJobs.data} />;
}

function renderButton() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <Harness />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('saved job controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(savedJobService.list).mockResolvedValue([]);
    vi.mocked(savedJobService.save).mockResolvedValue({
      job,
      savedAt: '2026-07-27T10:00:00.000Z',
    });
    vi.mocked(savedJobService.remove).mockResolvedValue(undefined);
  });

  it('saves and unsaves a job with an accessible pressed state', async () => {
    const user = userEvent.setup();
    renderButton();

    const save = await screen.findByRole('button', { name: 'Save Frontend Engineer' });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    await user.click(save);

    await waitFor(() => expect(savedJobService.save).toHaveBeenCalledWith('job-1'));
    const unsave = await screen.findByRole('button', { name: 'Unsave Frontend Engineer' });
    expect(unsave).toHaveAttribute('aria-pressed', 'true');
    await user.click(unsave);

    await waitFor(() => expect(savedJobService.remove).toHaveBeenCalledWith('job-1'));
  });
});
