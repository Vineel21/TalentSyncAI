import type { JobRow, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import type { JobsRepository } from '../src/modules/jobs/repository.js';
import { JobsService } from '../src/modules/jobs/service.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const now = '2026-07-27T00:00:00.000Z';
const recruiter: UserRow = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'recruiter@example.com',
  role: 'recruiter',
  created_at: now,
  updated_at: now,
};
const job: JobRow = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  recruiter_id: recruiter.id,
  title: 'TypeScript Engineer',
  company_name: 'TalentSync',
  location: 'Remote',
  employment_type: 'full_time',
  salary_min: 100_000,
  salary_max: 140_000,
  currency: 'USD',
  description: 'Build secure, production-ready hiring systems.',
  requirements: 'Strong TypeScript and PostgreSQL experience.',
  required_skills: ['TypeScript', 'PostgreSQL'],
  status: 'open',
  expires_at: null,
  published_at: now,
  deleted_at: null,
  search_vector: '',
  created_at: now,
  updated_at: now,
};
const context: AuthenticatedContext = {
  user: recruiter,
  accessToken: 'access-token',
  client: {} as DatabaseClient,
};

describe('JobsService', () => {
  it('uses the standard pagination contract', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({ rows: [job], total: 21 }),
    } as unknown as JobsRepository;
    const service = new JobsService(repository);

    const result = await service.list(context, { page: 2, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('rejects publishing an already expired job', async () => {
    const repository = {
      create: vi.fn(),
    } as unknown as JobsRepository;
    const service = new JobsService(repository);

    await expect(
      service.create(context, {
        title: 'Expired role',
        companyName: 'TalentSync',
        location: 'Remote',
        employmentType: 'full_time',
        salaryMin: null,
        salaryMax: null,
        description: 'A sufficiently long role description.',
        requirements: 'A sufficiently long requirement.',
        requiredSkills: ['TypeScript'],
        status: 'open',
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'JOB_EXPIRED' });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
