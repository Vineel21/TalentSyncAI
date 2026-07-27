import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingStepper } from '@/features/onboarding/onboarding-stepper';
import { DataExtractionStep } from '@/features/onboarding/steps/data-extraction-step';
import { resumeService } from '@/services/resume.service';

vi.mock('@/services/resume.service', () => ({
  resumeService: {
    upload: vi.fn(),
    parse: vi.fn(),
  },
}));

function renderEntry(onContinue = vi.fn().mockResolvedValue(undefined)) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={client}>
      <DataExtractionStep currentSource={null} isAdvancing={false} onContinue={onContinue} />
    </QueryClientProvider>,
  );
  return onContinue;
}

describe('candidate onboarding entry and progress UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeService.upload).mockResolvedValue({
      resume: {
        analysisId: 'analysis-1',
        resumePath: 'candidate-1/resume.pdf',
        originalFilename: 'resume.pdf',
        status: 'pending',
      },
    });
    vi.mocked(resumeService.parse).mockResolvedValue({
      skills: ['React'],
      education: [],
      experience: [],
      certifications: [],
    });
  });

  it('supports the manual path and explains the later resume requirement', async () => {
    const user = userEvent.setup();
    const onContinue = renderEntry();

    expect(
      screen.getByText(/need to upload one before submitting an application/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue with manual entry/i }));

    expect(onContinue).toHaveBeenCalledWith('manual');
  });

  it('uploads and parses a PDF before advancing to profile refinement', async () => {
    const user = userEvent.setup();
    const onContinue = renderEntry();
    const file = new File(['%PDF-1.4'], 'candidate.pdf', { type: 'application/pdf' });

    await user.upload(screen.getByLabelText('Resume PDF'), file);
    await user.click(screen.getByRole('button', { name: /upload, parse, and continue/i }));

    await waitFor(() => expect(resumeService.upload).toHaveBeenCalledWith(file));
    await waitFor(() => expect(resumeService.parse).toHaveBeenCalledOnce());
    await waitFor(() => expect(onContinue).toHaveBeenCalledWith('resume'));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('announces the current step and only enables backward navigation', async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(<OnboardingStepper currentStep={2} onStepSelect={onStepSelect} />);

    expect(screen.getByText(/step 2 of 3: review details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review/i })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /matches/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /import/i }));
    expect(onStepSelect).toHaveBeenCalledWith(1);
  });
});
