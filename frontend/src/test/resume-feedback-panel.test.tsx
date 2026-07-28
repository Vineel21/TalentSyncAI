import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeFeedbackPanel } from '@/features/applications/resume-feedback-panel';
import { ToastProvider } from '@/features/shared/toast-provider';
import { aiService } from '@/services/ai.service';
import type { ResumeFeedback } from '@/types/api';

const aiProcessing = vi.hoisted(() => ({
  live: true,
}));

vi.mock('@/config/ai-processing', () => ({
  assessmentModeMessage:
    'Live AI processing is disabled in this assessment deployment. No newly uploaded resume or profile data is sent to Gemini. Use manual profile entry; seeded demo accounts retain their prepared AI results.',
  isLiveAiProcessingEnabled: () => aiProcessing.live,
}));

vi.mock('@/services/ai.service', () => ({
  aiService: {
    resumeFeedback: vi.fn(),
  },
}));

const persistedFeedback: ResumeFeedback = {
  grammar: ['Replace passive phrasing with active verbs.'],
  ats: ['Add the target role near the top.'],
  skills: ['Group related frontend skills.'],
  projects: [],
  formatting: ['Use consistent date formatting.'],
  achievements: ['Quantify the checkout improvement.'],
};

function renderPanel(initialFeedback?: ResumeFeedback | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries');

  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ResumeFeedbackPanel applicationId="application-1" initialFeedback={initialFeedback} />
      </ToastProvider>
    </QueryClientProvider>,
  );

  return { invalidateQueries };
}

describe('ResumeFeedbackPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiProcessing.live = true;
  });

  it('shows persisted structured feedback and a regenerate action', () => {
    renderPanel(persistedFeedback);

    expect(screen.getByText('ATS readiness')).toBeInTheDocument();
    expect(screen.getByText('Add the target role near the top.')).toBeInTheDocument();
    expect(screen.getByText('No project improvements were suggested.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate feedback' })).toBeInTheDocument();
    expect(aiService.resumeFeedback).not.toHaveBeenCalled();
  });

  it('moves from empty to loading to success and refreshes application data', async () => {
    const user = userEvent.setup();
    let resolveFeedback: ((feedback: ResumeFeedback) => void) | undefined;
    vi.mocked(aiService.resumeFeedback).mockReturnValue(
      new Promise<ResumeFeedback>((resolve) => {
        resolveFeedback = resolve;
      }),
    );
    const { invalidateQueries } = renderPanel();

    expect(screen.getByText('No resume feedback yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generate feedback' }));

    expect(screen.getByRole('status', { name: 'Generating resume feedback' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generating feedback' })).toBeDisabled();

    await act(async () => {
      resolveFeedback?.(persistedFeedback);
    });

    expect(await screen.findByText('Quantify the checkout improvement.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate feedback' })).toBeInTheDocument();
    expect(aiService.resumeFeedback).toHaveBeenCalledWith('application-1');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['applications'] });
  });

  it('renders an inline retryable error state', async () => {
    const user = userEvent.setup();
    vi.mocked(aiService.resumeFeedback).mockRejectedValue(new Error('Provider unavailable'));
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Generate feedback' }));

    const error = await screen.findByRole('alert', { name: 'Resume feedback unavailable' });
    expect(error).toHaveTextContent('Provider unavailable');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('No resume feedback yet')).not.toBeInTheDocument();
  });

  it('keeps stored feedback visible without a live generation control in assessment mode', () => {
    aiProcessing.live = false;
    renderPanel(persistedFeedback);

    expect(screen.getByText('ATS readiness')).toBeInTheDocument();
    expect(screen.getByText('Add the target role near the top.')).toBeInTheDocument();
    expect(
      screen.getByText(/Showing stored synthetic feedback. Live regeneration is paused/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /generate|regenerate|refreshing feedback/i }),
    ).not.toBeInTheDocument();
    expect(aiService.resumeFeedback).not.toHaveBeenCalled();
  });
});
