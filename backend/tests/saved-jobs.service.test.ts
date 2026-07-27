import type { JobRow, SavedJobRow, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { SavedJobsService } from '../src/modules/saved-jobs/service.js';
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
const job: JobRow = {
  id: '22222222-2222-4222-8222-222222222222',
  recruiter_id: '33333333-3333-4333-8333-333333333333',
  title: 'Frontend Engineer',
  company_name: 'TalentSync',
  location: 'Remote',
  employment_type: 'full_time',
  salary_min: null,
  salary_max: null,
  currency: 'USD',
  description: 'Build accessible candidate experiences.',
  requirements: 'Strong React and TypeScript skills.',
  required_skills: ['React', 'TypeScript'],
  status: 'open',
  expires_at: null,
  published_at: now,
  deleted_at: null,
  search_vector: '',
  created_at: now,
  updated_at: now,
};
const savedJob: SavedJobRow = {
  candidate_id: candidate.id,
  job_id: job.id,
  created_at: now,
};

const repositorySpies = () => ({
  list: vi.fn(),
  find: vi.fn(),
  findOpenJob: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
});

describe('SavedJobsService', () => {
  it('serializes saved jobs in the public API shape', async () => {
    const repository = repositorySpies();
    repository.list.mockResolvedValue([{ savedJob, job }]);
    const service = new SavedJobsService(repository);

    const result = await service.list(context);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      job: { id: job.id, title: job.title },
      savedAt: now,
    });
    expect(repository.list).toHaveBeenCalledWith(context.client, candidate.id);
  });

  it('verifies the job is open before saving it', async () => {
    const repository = repositorySpies();
    repository.findOpenJob.mockResolvedValue(job);
    repository.find.mockResolvedValue(null);
    repository.save.mockResolvedValue(savedJob);
    const service = new SavedJobsService(
      repository,
      () => new Date(now),
    );

    await expect(service.save(context, job.id)).resolves.toMatchObject({
      job: { id: job.id },
      savedAt: now,
    });
    expect(repository.findOpenJob).toHaveBeenCalledWith(context.client, job.id, now);
    expect(repository.save).toHaveBeenCalledWith(context.client, candidate.id, job.id);
  });

  it('treats duplicate saves as idempotent', async () => {
    const repository = repositorySpies();
    repository.findOpenJob.mockResolvedValue(job);
    repository.find.mockResolvedValue(savedJob);
    const service = new SavedJobsService(repository);

    await expect(service.save(context, job.id)).resolves.toMatchObject({
      job: { id: job.id },
      savedAt: now,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('removes only the current candidate saved-job pair', async () => {
    const repository = repositorySpies();
    repository.remove.mockResolvedValue(undefined);
    const service = new SavedJobsService(repository);

    await expect(service.remove(context, job.id)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(context.client, candidate.id, job.id);
  });
});
