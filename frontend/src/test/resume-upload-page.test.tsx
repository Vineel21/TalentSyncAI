import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/features/shared/toast-provider';
import { ResumeUploadPage } from '@/pages/candidate/resume-upload-page';
import { profileService } from '@/services/profile.service';
import { resumeService } from '@/services/resume.service';

vi.mock('@/services/profile.service', () => ({
  profileService: {
    getMine: vi.fn(),
  },
}));

vi.mock('@/services/resume.service', () => ({
  resumeService: {
    upload: vi.fn(),
    parse: vi.fn(),
  },
}));

const profile = {
  id: 'profile-1',
  userId: 'candidate-1',
  fullName: 'Ada Candidate',
  summary: '',
  skills: [],
  education: [],
  experience: [],
  certifications: [],
  resumePath: null,
  profileCompletion: 25,
};

const parsedResume = {
  skills: ['TypeScript'],
  education: [],
  experience: [],
  certifications: [],
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
      <MemoryRouter>
        <ToastProvider>
          <ResumeUploadPage />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResumeUploadPage Gemini processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileService.getMine).mockResolvedValue(profile);
    vi.mocked(resumeService.upload).mockResolvedValue({
      resume: {
        analysisId: 'analysis-1',
        resumePath: 'candidate-1/resume.pdf',
        originalFilename: 'resume.pdf',
        status: 'pending',
      },
    });
    vi.mocked(resumeService.parse).mockResolvedValue(parsedResume);
  });

  it('discloses paid Gemini processing and uploads a valid file without a consent gate', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('Resume PDF');
    const resume = new File(['%PDF-1.4 resume'], 'resume.pdf', { type: 'application/pdf' });
    await user.upload(input, resume);

    expect(
      screen.getByText(/processed through a billing-enabled Gemini API project/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/not used to improve Google products/i)).toBeInTheDocument();
    expect(
      screen.getByText(/retain prompts and responses for a limited period/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/authorized application matching/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Upload and parse' });
    expect(submit).toBeEnabled();
    expect(resumeService.upload).not.toHaveBeenCalled();
    expect(resumeService.parse).not.toHaveBeenCalled();

    await user.click(submit);

    await waitFor(() => expect(resumeService.upload).toHaveBeenCalledWith(resume));
    await waitFor(() => expect(resumeService.parse).toHaveBeenCalledOnce());
  });

  it('uploads the replacement file immediately when a different resume is selected', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('Resume PDF');
    const firstResume = new File(['%PDF-1.4 first'], 'first.pdf', {
      type: 'application/pdf',
    });
    const replacementResume = new File(['%PDF-1.4 replacement'], 'replacement.pdf', {
      type: 'application/pdf',
    });

    await user.upload(input, firstResume);
    expect(screen.getByText('first.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload and parse' })).toBeEnabled();

    await user.upload(input, replacementResume);

    expect(screen.queryByText('first.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('replacement.pdf')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Upload and parse' });
    expect(submit).toBeEnabled();

    await user.click(submit);

    await waitFor(() => expect(resumeService.upload).toHaveBeenCalledWith(replacementResume));
    await waitFor(() => expect(resumeService.parse).toHaveBeenCalledOnce());
  });
});
