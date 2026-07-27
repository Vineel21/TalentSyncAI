import type {
  ApplicationRow,
  ApplicationStatus,
  JobRow,
  ProfileRow,
} from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { throwDatabaseError } from '../../shared/errors.js';
import type {
  CandidateDashboardStats,
  DashboardRepositoryData,
  RecruiterDashboardStats,
} from './types.js';

const countApplications = async (
  client: DatabaseClient,
  userId: string,
  role: 'candidate' | 'recruiter',
  jobIds: string[],
  status?: ApplicationStatus,
): Promise<number> => {
  if (role === 'recruiter' && jobIds.length === 0) return 0;
  let query = client.from('applications').select('id', { count: 'exact', head: true });
  query = role === 'candidate' ? query.eq('candidate_id', userId) : query.in('job_id', jobIds);
  if (status) query = query.eq('status', status);
  const { count, error } = await query;
  if (error) throwDatabaseError(error, 'Unable to calculate dashboard applications');
  return count ?? 0;
};

const unreadCount = async (client: DatabaseClient, userId: string): Promise<number> => {
  const { count, error } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throwDatabaseError(error, 'Unable to calculate unread notifications');
  return count ?? 0;
};

const hydrateApplications = async (
  client: DatabaseClient,
  applications: ApplicationRow[],
  includeProfiles: boolean,
) => {
  const jobIds = [...new Set(applications.map((application) => application.job_id))];
  const candidateIds = [...new Set(applications.map((application) => application.candidate_id))];
  let jobs: JobRow[] = [];
  let profiles: ProfileRow[] = [];

  if (jobIds.length) {
    const result = await client.from('jobs').select('*').in('id', jobIds);
    if (result.error) throwDatabaseError(result.error, 'Unable to load dashboard jobs');
    jobs = result.data ?? [];
  }
  if (includeProfiles && candidateIds.length) {
    const result = await client.from('profiles').select('*').in('user_id', candidateIds);
    if (result.error) {
      throwDatabaseError(result.error, 'Unable to load dashboard profiles');
    }
    profiles = result.data ?? [];
  }

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const profilesByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
  return applications.map((application) => ({
    application,
    job: jobsById.get(application.job_id) ?? null,
    profile: profilesByUser.get(application.candidate_id) ?? null,
    analysis: null,
  }));
};

export class DashboardRepository {
  public async candidate(client: DatabaseClient, userId: string): Promise<DashboardRepositoryData> {
    const profileResult = await client
      .from('profiles')
      .select('profile_completion')
      .eq('user_id', userId)
      .maybeSingle();
    if (profileResult.error) {
      throwDatabaseError(profileResult.error, 'Unable to load profile completion');
    }

    const [
      totalApplications,
      underReview,
      shortlisted,
      interviews,
      offers,
      unreadNotifications,
      recentResult,
      jobsResult,
    ] = await Promise.all([
      countApplications(client, userId, 'candidate', []),
      countApplications(client, userId, 'candidate', [], 'under_review'),
      countApplications(client, userId, 'candidate', [], 'shortlisted'),
      countApplications(client, userId, 'candidate', [], 'interview'),
      countApplications(client, userId, 'candidate', [], 'offer'),
      unreadCount(client, userId),
      client
        .from('applications')
        .select('*')
        .eq('candidate_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      client
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .is('deleted_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    if (recentResult.error) {
      throwDatabaseError(recentResult.error, 'Unable to load recent applications');
    }
    if (jobsResult.error) {
      throwDatabaseError(jobsResult.error, 'Unable to load recommended jobs');
    }

    const stats: CandidateDashboardStats = {
      profileCompletion: profileResult.data?.profile_completion ?? 0,
      totalApplications,
      underReview,
      shortlisted,
      interviews,
      offers,
      unreadNotifications,
    };
    return {
      stats,
      recentApplications: await hydrateApplications(client, recentResult.data ?? [], false),
      recommendedJobs: jobsResult.data ?? [],
      recentJobs: [],
      recentApplicants: [],
    };
  }

  public async recruiter(client: DatabaseClient, userId: string): Promise<DashboardRepositoryData> {
    const jobsResult = await client
      .from('jobs')
      .select('*')
      .eq('recruiter_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (jobsResult.error) throwDatabaseError(jobsResult.error, 'Unable to load recruiter jobs');
    const jobs = jobsResult.data ?? [];
    const jobIds = jobs.map((job) => job.id);

    let recentApplications: ApplicationRow[] = [];
    if (jobIds.length) {
      const result = await client
        .from('applications')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(5);
      if (result.error) {
        throwDatabaseError(result.error, 'Unable to load recent applicants');
      }
      recentApplications = result.data ?? [];
    }

    const [
      totalApplicants,
      pending,
      shortlisted,
      interviews,
      rejected,
      offers,
      unreadNotifications,
    ] = await Promise.all([
      countApplications(client, userId, 'recruiter', jobIds),
      countApplications(client, userId, 'recruiter', jobIds, 'applied'),
      countApplications(client, userId, 'recruiter', jobIds, 'shortlisted'),
      countApplications(client, userId, 'recruiter', jobIds, 'interview'),
      countApplications(client, userId, 'recruiter', jobIds, 'rejected'),
      countApplications(client, userId, 'recruiter', jobIds, 'offer'),
      unreadCount(client, userId),
    ]);

    const stats: RecruiterDashboardStats = {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
      totalApplicants,
      pending,
      shortlisted,
      interviews,
      rejected,
      offers,
      unreadNotifications,
    };
    return {
      stats,
      recentApplications: [],
      recommendedJobs: [],
      recentJobs: jobs.slice(0, 5),
      recentApplicants: await hydrateApplications(client, recentApplications, true),
    };
  }
}
