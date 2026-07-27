import { describe, expect, it, vi } from 'vitest';
import type { UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import type { DashboardRepository } from '../src/modules/dashboard/repository.js';
import { DashboardService } from '../src/modules/dashboard/service.js';
import type { DashboardRepositoryData } from '../src/modules/dashboard/types.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const referenceDate = new Date('2026-07-27T12:00:00.000Z');
const recruiter: UserRow = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'recruiter@example.com',
  role: 'recruiter',
  created_at: referenceDate.toISOString(),
  updated_at: referenceDate.toISOString(),
};
const context: AuthenticatedContext = {
  user: recruiter,
  accessToken: 'access-token',
  client: {} as DatabaseClient,
};
const repositoryData: DashboardRepositoryData = {
  stats: {
    totalJobs: 1,
    openJobs: 1,
    totalApplicants: 1,
    pending: 0,
    shortlisted: 0,
    interviews: 1,
    rejected: 0,
    offers: 0,
    unreadNotifications: 0,
  },
  recentApplications: [],
  recommendedJobs: [],
  recentJobs: [],
  recentApplicants: [],
  activityApplications: [{ created_at: '2026-07-10T10:00:00.000Z', status: 'interview' }],
};

describe('DashboardService', () => {
  it('requests the UTC activity window and returns serialized recruiter analytics', async () => {
    const recruiterDashboard = vi.fn().mockResolvedValue(repositoryData);
    const repository = {
      recruiter: recruiterDashboard,
      candidate: vi.fn(),
    } as unknown as DashboardRepository;
    const service = new DashboardService(repository, () => referenceDate);

    const result = await service.get(context);

    expect(recruiterDashboard).toHaveBeenCalledWith(
      context.client,
      recruiter.id,
      '2026-02-01T00:00:00.000Z',
      '2026-08-01T00:00:00.000Z',
    );
    expect(result.analytics.at(-1)).toEqual({
      label: 'Jul',
      applicants: 1,
      interviews: 1,
    });
  });
});
