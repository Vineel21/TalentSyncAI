import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { JobsPage } from '@/pages/candidate/jobs-page';
import { jobService } from '@/services/job.service';

vi.mock('@/services/job.service', () => ({
  jobService: {
    list: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('JobsPage states', () => {
  it('renders a clear empty search state', async () => {
    vi.mocked(jobService.list).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 9, total: 0, totalPages: 0 },
    });
    renderPage();
    expect(screen.getByLabelText('Searching jobs')).toBeInTheDocument();
    expect(await screen.findByText('No jobs match your search')).toBeInTheDocument();
  });

  it('renders a retryable API error state', async () => {
    vi.mocked(jobService.list).mockRejectedValue(new Error('Network unavailable'));
    renderPage();
    expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
