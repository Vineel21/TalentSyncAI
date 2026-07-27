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

describe('ResumeUploadPage Gemini consent', () => {
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

  it('discloses billing-enabled Gemini processing and requires consent before upload', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('Resume PDF');
    const resume = new File(['%PDF-1.4 resume'], 'resume.pdf', { type: 'application/pdf' });
    await user.upload(input, resume);

    expect(
      screen.getByText(/processed only through a billing-enabled Gemini API project/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/not used to improve Google products/i)).toBeInTheDocument();
    expect(screen.getByText(/authorized application matching/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm I am 18 or older/i)).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Upload and parse' });
    expect(submit).toBeDisabled();
    expect(resumeService.upload).not.toHaveBeenCalled();
    expect(resumeService.parse).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /consent to Google Gemini processing my resume text/i,
      }),
    );
    expect(submit).toBeEnabled();

    await user.click(submit);

    await waitFor(() => expect(resumeService.upload).toHaveBeenCalledWith(resume));
    await waitFor(() => expect(resumeService.parse).toHaveBeenCalledOnce());
  });

  it('requires fresh consent when a different resume is selected', async () => {
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
    const consent = screen.getByRole('checkbox', {
      name: /consent to Google Gemini processing my resume text/i,
    });
    await user.click(consent);
    expect(consent).toBeChecked();
    expect(screen.getByRole('button', { name: 'Upload and parse' })).toBeEnabled();

    await user.upload(input, replacementResume);

    expect(consent).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Upload and parse' })).toBeDisabled();
  });
});
