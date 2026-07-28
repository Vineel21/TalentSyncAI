import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '@/pages/public/landing-page';
import { jobService } from '@/services/job.service';

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/services/job.service', () => ({
  jobService: {
    list: vi.fn(),
  },
}));

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];

  disconnect() {}

  observe() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LandingPage assessment claims', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobService.list).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 3, total: 0, totalPages: 0 },
    });
  });

  it('does not advertise unverified accuracy or live Gemini resume parsing', () => {
    renderPage();

    expect(screen.queryByText('94%')).not.toBeInTheDocument();
    expect(screen.queryByText('Match Accuracy')).not.toBeInTheDocument();
    expect(screen.queryByText(/Gemini AI extracts your work experience/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Private backend parsing begins immediately/i),
    ).not.toBeInTheDocument();
  });
});
