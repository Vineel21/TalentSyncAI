import type { JobRow, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import type { AiService } from '../src/modules/ai/service.js';
import { OnboardingService } from '../src/modules/onboarding/service.js';
import { fallbackMatchForJob, type OnboardingProfile } from '../src/modules/onboarding/types.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const now = '2026-07-27T12:00:00.000Z';
const candidate: UserRow = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'candidate@example.com',
  role: 'candidate',
  created_at: now,
  updated_at: now,
};
const context: AuthenticatedContext = {
  user: candidate,
  accessToken: 'access-token',
  client: {} as DatabaseClient,
};

const readyFresherProfile = (overrides: Partial<OnboardingProfile> = {}): OnboardingProfile => ({
  user_id: candidate.id,
  full_name: 'Ada Lovelace',
  headline: 'Software Engineer',
  location: 'Remote',
  summary: 'A graduate engineer who builds reliable TypeScript applications.',
  skills: ['TypeScript', 'React'],
  education: [{ institution: 'Example University', degree: 'BSc' }],
  experience: [],
  onboarding_step: 2,
  onboarding_source: 'manual',
  onboarding_completed_at: null,
  recommendations_skipped_at: null,
  ...overrides,
});

const job = (id: string, overrides: Partial<JobRow> = {}): JobRow => ({
  id,
  recruiter_id: '22222222-2222-4222-8222-222222222222',
  title: 'Software Engineer',
  company_name: 'TalentSync',
  location: 'Remote',
  employment_type: 'full_time',
  salary_min: null,
  salary_max: null,
  currency: 'USD',
  description: 'Build reliable hiring applications.',
  requirements: 'Strong engineering fundamentals.',
  required_skills: ['TypeScript'],
  status: 'open',
  expires_at: null,
  published_at: now,
  deleted_at: null,
  search_vector: '',
  created_at: now,
  updated_at: now,
  ...overrides,
});

const repositorySpies = () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  listRecommendationJobs: vi.fn(),
});

describe('OnboardingService', () => {
  it('requires candidates to choose an extraction source before step two', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(
      readyFresherProfile({ onboarding_step: 1, onboarding_source: null }),
    );
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.updateProgress(context, { step: 2 })).rejects.toMatchObject({
      code: 'ONBOARDING_SOURCE_REQUIRED',
      statusCode: 400,
    });
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it('prevents candidates from skipping sequential steps', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(
      readyFresherProfile({ onboarding_step: 1, onboarding_source: 'manual' }),
    );
    const service = new OnboardingService(repository, {} as AiService);

    await expect(
      service.updateProgress(context, { step: 3, source: 'manual' }),
    ).rejects.toMatchObject({
      code: 'INVALID_ONBOARDING_TRANSITION',
    });
  });

  it('reports every missing readiness requirement before step three', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(
      readyFresherProfile({
        full_name: ' ',
        headline: null,
        location: '',
        summary: ' ',
        skills: [],
        education: [],
        experience: [],
      }),
    );
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.updateProgress(context, { step: 3 })).rejects.toMatchObject({
      code: 'PROFILE_INCOMPLETE',
      details: [
        { field: 'profile.fullName' },
        { field: 'profile.headline' },
        { field: 'profile.location' },
        { field: 'profile.summary' },
        { field: 'profile.skills' },
        { field: 'profile.educationOrExperience' },
      ],
    });
  });

  it('does not treat empty structured profile entries as education or experience', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(
      readyFresherProfile({
        education: [{}],
        experience: [{}],
      }),
    );
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.updateProgress(context, { step: 3 })).rejects.toMatchObject({
      code: 'PROFILE_INCOMPLETE',
      details: [{ field: 'profile.educationOrExperience' }],
    });
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it('accepts a ready fresher with education and no work experience', async () => {
    const profile = readyFresherProfile();
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(profile);
    repository.updateProfile.mockResolvedValue({ ...profile, onboarding_step: 3 });
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.updateProgress(context, { step: 3 })).resolves.toMatchObject({
      currentStep: 3,
      source: 'manual',
    });
    expect(repository.updateProfile).toHaveBeenCalledWith(context.client, candidate.id, {
      onboarding_step: 3,
    });
  });

  it('requires step three before generating recommendations', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(readyFresherProfile({ onboarding_step: 2 }));
    repository.listRecommendationJobs.mockResolvedValue([]);
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.recommendations(context)).rejects.toMatchObject({
      code: 'INVALID_ONBOARDING_TRANSITION',
    });
  });

  it('returns AI matches per shortlisted job and deterministic fallbacks on provider failure', async () => {
    const primaryJob = job('33333333-3333-4333-8333-333333333333');
    const fallbackJob = job('44444444-4444-4444-8444-444444444444', {
      title: 'Go Developer',
      required_skills: ['Go'],
      created_at: '2026-07-26T12:00:00.000Z',
    });
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(readyFresherProfile({ onboarding_step: 3 }));
    repository.listRecommendationJobs.mockResolvedValue([fallbackJob, primaryJob]);
    const aiMatch = {
      score: 93,
      matchingSkills: ['TypeScript'],
      missingSkills: [],
      recommendation: 'excellent_match',
      rationale: 'The profile strongly matches the role.',
    } as const;
    const calculateMatch = vi.fn((_context: AuthenticatedContext, { jobId }: { jobId: string }) =>
      jobId === primaryJob.id
        ? Promise.resolve(aiMatch)
        : Promise.reject(new Error('provider unavailable')),
    );
    const service = new OnboardingService(repository, { calculateMatch } as unknown as AiService);

    const recommendations = await service.recommendations(context);

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({
      job: { id: primaryJob.id },
      match: aiMatch,
      aiGenerated: true,
    });
    expect(recommendations[1]).toMatchObject({
      job: { id: fallbackJob.id },
      match: {
        matchingSkills: [],
        missingSkills: ['Go'],
        recommendation: 'poor_match',
      },
      aiGenerated: false,
    });
    expect(calculateMatch).toHaveBeenCalledTimes(2);
  });

  it('uses score thresholds consistently for deterministic recommendations', () => {
    const profile = readyFresherProfile({
      headline: 'Unrelated',
      location: 'Hyderabad',
      skills: ['One', 'Two', 'Three', 'Four'],
    });
    const average = fallbackMatchForJob(
      profile,
      job('55555555-5555-4555-8555-555555555555', {
        title: 'Different Role',
        location: 'Bengaluru',
        required_skills: ['One', 'Two', 'Three', 'Four', 'Five'],
      }),
    );

    expect(average.score).toBe(60);
    expect(average.recommendation).toBe('average_match');
  });

  it('requires step three and a selected source before completion', async () => {
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(
      readyFresherProfile({ onboarding_step: 2, onboarding_source: null }),
    );
    const service = new OnboardingService(repository, {} as AiService);

    await expect(service.complete(context, { skippedRecommendations: true })).rejects.toMatchObject(
      {
        code: 'INVALID_ONBOARDING_TRANSITION',
      },
    );
  });

  it('records completion and recommendation skipping with one server timestamp', async () => {
    const profile = readyFresherProfile({ onboarding_step: 3 });
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(profile);
    repository.updateProfile.mockResolvedValue({
      ...profile,
      onboarding_completed_at: now,
      recommendations_skipped_at: now,
    });
    const service = new OnboardingService(repository, {} as AiService, () => new Date(now));

    await expect(
      service.complete(context, { skippedRecommendations: true }),
    ).resolves.toMatchObject({
      currentStep: 3,
      completedAt: now,
      recommendationsSkippedAt: now,
    });
    expect(repository.updateProfile).toHaveBeenCalledWith(context.client, candidate.id, {
      onboarding_step: 3,
      onboarding_completed_at: now,
      recommendations_skipped_at: now,
    });
  });

  it('keeps repeated completion idempotent', async () => {
    const completed = readyFresherProfile({
      full_name: '',
      onboarding_step: 3,
      onboarding_completed_at: now,
    });
    const repository = repositorySpies();
    repository.getProfile.mockResolvedValue(completed);
    const service = new OnboardingService(repository, {} as AiService);

    await expect(
      service.complete(context, { skippedRecommendations: false }),
    ).resolves.toMatchObject({ completedAt: now });
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });
});
