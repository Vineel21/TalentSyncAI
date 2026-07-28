import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/features/shared/toast-provider';
import { ApplicantsPage } from '@/pages/recruiter/applicants-page';
import { aiService } from '@/services/ai.service';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';
import type { Application, Job, Profile, ResumeFeedback } from '@/types/api';

vi.mock('@/config/ai-processing', () => ({
  assessmentModeMessage:
    'Live AI processing is disabled in this assessment deployment. No newly uploaded resume or profile data is sent to Gemini. Use manual profile entry; seeded demo accounts retain their prepared AI results.',
  isLiveAiProcessingEnabled: () => false,
}));

vi.mock('@/services/ai.service', () => ({
  aiService: {
    applicationMatchScore: vi.fn(),
    candidateSummary: vi.fn(),
    resumeFeedback: vi.fn(),
  },
}));

vi.mock('@/services/application.service', () => ({
  applicationService: {
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/services/job.service', () => ({
  jobService: {
    get: vi.fn(),
  },
}));

vi.mock('@/services/resume.service', () => ({
  resumeService: {
    download: vi.fn(),
  },
}));

const job: Job = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  title: 'Backend Engineer',
  companyName: 'TalentSync Labs',
  location: 'Hyderabad, India',
  employmentType: 'full_time',
  description: 'Build reliable hiring services.',
  requirements: 'Node.js and PostgreSQL experience.',
  requiredSkills: ['Node.js', 'PostgreSQL'],
  status: 'open',
  createdAt: '2026-07-20T10:00:00.000Z',
};

const candidateProfile: Profile = {
  id: 'profile-1',
  userId: 'candidate-1',
  fullName: 'Meera Backend',
  headline: 'Backend Engineer',
  location: 'Hyderabad, India',
  summary: 'Five years building reliable Node.js services.',
  skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
  education: [],
  experience: [],
  certifications: [],
  resumePath: 'resumes/meera-backend.pdf',
  profileCompletion: 100,
};

const storedFeedback: ResumeFeedback = {
  grammar: ['Use consistent verb tense.'],
  ats: ['Keep Node.js in the skills section.'],
  skills: ['Explain PostgreSQL performance work.'],
  projects: ['Quantify the queue throughput improvement.'],
  formatting: [],
  achievements: ['Add latency reduction percentages.'],
};

const seededApplication: Application = {
  id: 'application-1',
  jobId: job.id,
  candidateId: candidateProfile.userId,
  resumePath: 'resumes/meera-backend.pdf',
  coverLetter: 'I enjoy building dependable backend systems.',
  status: 'shortlisted',
  aiMatchScore: 87,
  createdAt: '2026-07-22T10:00:00.000Z',
  job,
  candidateProfile,
  analysis: {
    status: 'completed',
    matchScore: 87,
    candidateSummary: 'Seeded AI summary: strong backend ownership and database experience.',
    resumeFeedback: storedFeedback,
    matchingSkills: ['Node.js', 'PostgreSQL'],
    missingSkills: ['Redis'],
    recommendations: ['Discuss distributed systems trade-offs.'],
    model: 'seed-fixture',
    completedAt: '2026-07-22T10:05:00.000Z',
  },
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
      <MemoryRouter initialEntries={['/recruiter/jobs/job-1/applicants']}>
        <ToastProvider>
          <Routes>
            <Route element={<ApplicantsPage />} path="/recruiter/jobs/:id/applicants" />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ApplicantsPage assessment mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobService.get).mockResolvedValue(job);
    vi.mocked(applicationService.list).mockResolvedValue({
      items: [seededApplication],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
  });

  it('preserves seeded AI results while preventing new recruiter AI requests', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'View Profile' }));

    expect(screen.getAllByText('87%').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Seeded AI summary: strong backend ownership and database experience.')
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Keep Node.js in the skills section.')).toBeInTheDocument();
    expect(
      screen.getByText(/Stored synthetic AI results remain visible for assessment/i),
    ).toBeInTheDocument();

    const liveControls = screen.queryAllByRole('button', {
      name: /generate analysis|refresh score|generate ai summary|generate feedback|regenerate feedback/i,
    });
    liveControls.forEach((control) => expect(control).toBeDisabled());

    expect(aiService.applicationMatchScore).not.toHaveBeenCalled();
    expect(aiService.candidateSummary).not.toHaveBeenCalled();
    expect(aiService.resumeFeedback).not.toHaveBeenCalled();
  });
});
