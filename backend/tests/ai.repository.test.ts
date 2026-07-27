import type { ApplicationRow, JobRow, ProfileRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { CURRENT_GEMINI_CONSENT_VERSION } from '../src/modules/ai/consent.js';
import { AiRepository } from '../src/modules/ai/repository.js';
import type { ResumeParseResult } from '../src/modules/ai/types.js';

const now = '2026-07-27T00:00:00.000Z';
const candidateId = '11111111-1111-4111-8111-111111111111';
const application: ApplicationRow = {
  id: '22222222-2222-4222-8222-222222222222',
  job_id: '33333333-3333-4333-8333-333333333333',
  candidate_id: candidateId,
  resume_path: `${candidateId}/submitted.pdf`,
  cover_letter: null,
  status: 'applied',
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
  description: 'Build reliable hiring services.',
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
  user_id: candidateId,
  full_name: 'Current Candidate',
  phone: null,
  headline: 'Current profile headline',
  location: 'Current profile location',
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  summary: 'Current profile summary.',
  skills: ['Current profile skill'],
  education: [],
  experience: [],
  certifications: [],
  resume_path: application.resume_path,
  profile_completion: 100,
  created_at: now,
  updated_at: now,
};
const parsedSnapshot: ResumeParseResult = {
  name: 'Submitted Candidate',
  email: 'submitted@example.com',
  phone: null,
  headline: 'Submitted resume headline',
  location: 'Submitted resume location',
  linkedin: null,
  github: null,
  portfolio: null,
  summary: 'Submitted resume summary.',
  skills: ['Submitted resume skill'],
  education: [],
  experience: [],
  certifications: [],
};
const currentConsent = {
  gemini_consent_version: CURRENT_GEMINI_CONSENT_VERSION,
  gemini_consented_at: now,
};

const createQuery = (data: unknown) => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  return query;
};

const createClient = (resumeAnalysis: unknown) => {
  const applicationQuery = createQuery(application);
  const jobQuery = createQuery(job);
  const profileQuery = createQuery(profile);
  const resumeQuery = createQuery(resumeAnalysis);
  const queries = new Map<string, ReturnType<typeof createQuery>>([
    ['applications', applicationQuery],
    ['jobs', jobQuery],
    ['profiles', profileQuery],
    ['resume_analyses', resumeQuery],
  ]);
  const client = {
    from: vi.fn((table: string) => queries.get(table)),
  } as unknown as DatabaseClient;
  return { client, resumeQuery };
};

describe('AiRepository application evidence', () => {
  it('loads and validates the completed analysis for the submitted resume path', async () => {
    const { client, resumeQuery } = createClient({
      status: 'completed',
      extracted_text: 'Submitted immutable resume text.',
      parsed_data: parsedSnapshot,
      ...currentConsent,
    });

    const bundle = await new AiRepository().getApplicationBundle(client, application.id);

    expect(bundle.resumeSnapshot).toEqual(parsedSnapshot);
    expect(bundle.resumeText).toBe('Submitted immutable resume text.');
    expect(bundle.resumeConsent).toEqual({
      version: CURRENT_GEMINI_CONSENT_VERSION,
      consentedAt: now,
    });
    const selectedColumns = resumeQuery.select.mock.calls[0]?.[0] as string;
    expect(selectedColumns).toContain('status');
    expect(selectedColumns).toContain('extracted_text');
    expect(selectedColumns).toContain('parsed_data');
    expect(selectedColumns).toContain('gemini_consent_version');
    expect(selectedColumns).toContain('gemini_consented_at');
    expect(resumeQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', candidateId);
    expect(resumeQuery.eq).toHaveBeenNthCalledWith(2, 'storage_path', application.resume_path);
  });

  it('loads candidate match consent from the exact current profile resume path', async () => {
    const { client, resumeQuery } = createClient({
      status: 'completed',
      extracted_text: 'Current resume text.',
      parsed_data: parsedSnapshot,
      ...currentConsent,
    });

    const bundle = await new AiRepository().getCandidateJobBundle(client, candidateId, job.id);

    expect(bundle.resumeConsent).toEqual({
      version: CURRENT_GEMINI_CONSENT_VERSION,
      consentedAt: now,
    });
    expect(resumeQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', candidateId);
    expect(resumeQuery.eq).toHaveBeenNthCalledWith(2, 'storage_path', profile.resume_path);
  });

  it('falls back when a completed analysis contains an invalid parsed snapshot', async () => {
    const { client } = createClient({
      status: 'completed',
      extracted_text: 'Submitted immutable resume text.',
      parsed_data: {
        ...parsedSnapshot,
        skills: 'not-an-array',
      },
      ...currentConsent,
    });

    const bundle = await new AiRepository().getApplicationBundle(client, application.id);

    expect(bundle.resumeSnapshot).toBeNull();
    expect(bundle.profile).toEqual(profile);
  });

  it('falls back when the resume analysis is not completed', async () => {
    const { client } = createClient({
      status: 'processing',
      extracted_text: null,
      parsed_data: parsedSnapshot,
      ...currentConsent,
    });

    const bundle = await new AiRepository().getApplicationBundle(client, application.id);

    expect(bundle.resumeSnapshot).toBeNull();
    expect(bundle.profile).toEqual(profile);
  });

  it('returns empty receipt fields when the exact application resume has no consent metadata', async () => {
    const { client } = createClient({
      status: 'completed',
      extracted_text: 'Submitted immutable resume text.',
      parsed_data: parsedSnapshot,
      gemini_consent_version: null,
      gemini_consented_at: null,
    });

    const bundle = await new AiRepository().getApplicationBundle(client, application.id);

    expect(bundle.resumeConsent).toEqual({
      version: null,
      consentedAt: null,
    });
  });
});
