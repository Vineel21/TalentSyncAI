import type { ApplicationRow, JobRow, ProfileRow, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import type { ApplicationsRepository } from '../src/modules/applications/repository.js';
import { ApplicationsService } from '../src/modules/applications/service.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const now = '2026-07-27T00:00:00.000Z';
const user: UserRow = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'candidate@example.com',
  role: 'candidate',
  created_at: now,
  updated_at: now,
};
const application: ApplicationRow = {
  id: '22222222-2222-4222-8222-222222222222',
  job_id: '33333333-3333-4333-8333-333333333333',
  candidate_id: user.id,
  resume_path: `${user.id}/resume.pdf`,
  cover_letter: null,
  status: 'offer',
  ai_match_score: null,
  created_at: now,
  updated_at: now,
};
const job: JobRow = {
  id: application.job_id,
  recruiter_id: '44444444-4444-4444-8444-444444444444',
  title: 'Backend Engineer',
  company_name: 'TalentSync',
  location: 'Remote',
  employment_type: 'full_time',
  salary_min: null,
  salary_max: null,
  currency: 'USD',
  description: 'Build production recruitment services.',
  requirements: 'Production TypeScript experience.',
  required_skills: ['TypeScript'],
  status: 'open',
  expires_at: null,
  published_at: now,
  deleted_at: null,
  search_vector: '',
  created_at: now,
  updated_at: now,
};
const profile: ProfileRow = {
  id: '55555555-5555-4555-8555-555555555555',
  user_id: user.id,
  full_name: 'Candidate',
  phone: null,
  headline: null,
  location: null,
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  summary: '',
  skills: [],
  education: [],
  experience: [],
  certifications: [],
  resume_path: application.resume_path,
  profile_completion: 20,
  onboarding_step: 3,
  onboarding_source: 'resume',
  onboarding_completed_at: now,
  recommendations_skipped_at: null,
  created_at: now,
  updated_at: now,
};

const context: AuthenticatedContext = {
  user,
  accessToken: 'access-token',
  client: {} as DatabaseClient,
};

describe('ApplicationsService', () => {
  it('rejects invalid recruiter status transitions', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        application,
        job,
        profile,
        analysis: null,
      }),
      updateStatus: vi.fn(),
    } as unknown as ApplicationsRepository;
    const service = new ApplicationsService(repository);

    await expect(
      service.updateStatus(
        {
          ...context,
          user: { ...user, role: 'recruiter' },
        },
        application.id,
        'interview',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('does not withdraw a finalized application', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        application: { ...application, status: 'rejected' },
        job,
        profile: null,
        analysis: null,
      }),
      withdraw: vi.fn(),
    } as unknown as ApplicationsRepository;
    const service = new ApplicationsService(repository);

    await expect(service.withdraw(context, application.id)).rejects.toMatchObject({
      code: 'APPLICATION_FINALIZED',
    });
    expect(repository.withdraw).not.toHaveBeenCalled();
  });
});
