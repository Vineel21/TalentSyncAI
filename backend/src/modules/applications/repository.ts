import type {
  AiAnalysisRow,
  ApplicationRow,
  ApplicationStatus,
  Database,
  JobRow,
  ProfileRow,
  UserRow,
} from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import { toRange } from '../../shared/pagination.js';
import type { ApplicationListInput, ApplicationRecord } from './types.js';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

export class ApplicationsRepository {
  private async hydrate(
    client: DatabaseClient,
    applications: ApplicationRow[],
    includeProfiles: boolean,
  ): Promise<ApplicationRecord[]> {
    const jobIds = [...new Set(applications.map((application) => application.job_id))];
    const candidateIds = [...new Set(applications.map((application) => application.candidate_id))];

    let jobs: JobRow[] = [];
    if (jobIds.length) {
      const result = await client.from('jobs').select('*').in('id', jobIds);
      if (result.error) throwDatabaseError(result.error, 'Unable to load application jobs');
      jobs = result.data ?? [];
    }

    let profiles: ProfileRow[] = [];
    if (includeProfiles && candidateIds.length) {
      const result = await client.from('profiles').select('*').in('user_id', candidateIds);
      if (result.error) throwDatabaseError(result.error, 'Unable to load candidate profiles');
      profiles = result.data ?? [];
    }

    let analyses: AiAnalysisRow[] = [];
    const applicationIds = applications.map((application) => application.id);
    if (applicationIds.length) {
      const result = await client
        .from('ai_analyses')
        .select('*')
        .in('application_id', applicationIds);
      if (result.error) {
        throwDatabaseError(result.error, 'Unable to load application analyses');
      }
      analyses = result.data ?? [];
    }

    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const profilesByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
    const analysesByApplicationId = new Map(
      analyses.map((analysis) => [analysis.application_id, analysis]),
    );
    return applications.map((application) => ({
      application,
      job: jobsById.get(application.job_id) ?? null,
      profile: profilesByUserId.get(application.candidate_id) ?? null,
      analysis: analysesByApplicationId.get(application.id) ?? null,
    }));
  }

  public async list(
    client: DatabaseClient,
    input: ApplicationListInput,
    user: Pick<UserRow, 'id' | 'role'>,
  ): Promise<{ records: ApplicationRecord[]; total: number }> {
    const [from, to] = toRange(input);
    let query = client.from('applications').select('*', { count: 'exact' });
    if (user.role === 'candidate') query = query.eq('candidate_id', user.id);
    if (input.status) query = query.eq('status', input.status);
    if (input.jobId) query = query.eq('job_id', input.jobId);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throwDatabaseError(error, 'Unable to list applications');

    return {
      records: await this.hydrate(client, data ?? [], user.role === 'recruiter'),
      total: count ?? 0,
    };
  }

  public async findById(
    client: DatabaseClient,
    applicationId: string,
    includeProfile: boolean,
  ): Promise<ApplicationRecord> {
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the application');
    if (!data) throw new NotFoundError('Application');
    const [record] = await this.hydrate(client, [data], includeProfile);
    if (!record) throw new NotFoundError('Application');
    return record;
  }

  public async findDuplicate(
    client: DatabaseClient,
    candidateId: string,
    jobId: string,
  ): Promise<ApplicationRow | null> {
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to check the application');
    return data;
  }

  public async findJob(client: DatabaseClient, jobId: string): Promise<JobRow> {
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the job');
    if (!data) throw new NotFoundError('Job');
    return data;
  }

  public async findCandidateProfile(
    client: DatabaseClient,
    candidateId: string,
  ): Promise<ProfileRow> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', candidateId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the candidate profile');
    if (!data) throw new NotFoundError('Candidate profile');
    return data;
  }

  public async create(
    client: DatabaseClient,
    input: ApplicationInsert,
  ): Promise<ApplicationRecord> {
    const { data, error } = await client.from('applications').insert(input).select('*').single();
    if (error) throwDatabaseError(error, 'Unable to submit the application');
    if (!data) throw new NotFoundError('Application');
    const [record] = await this.hydrate(client, [data], false);
    if (!record) throw new NotFoundError('Application');
    return record;
  }

  public async updateStatus(
    client: DatabaseClient,
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<ApplicationRecord> {
    const { data, error } = await client
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select('*')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to update the application status');
    if (!data) throw new NotFoundError('Application');
    const [record] = await this.hydrate(client, [data], true);
    if (!record) throw new NotFoundError('Application');
    return record;
  }

  public async withdraw(
    client: DatabaseClient,
    candidateId: string,
    applicationId: string,
  ): Promise<void> {
    const { data, error } = await client
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId)
      .eq('candidate_id', candidateId)
      .not('status', 'in', '("rejected","withdrawn")')
      .select('id')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to withdraw the application');
    if (!data) throw new NotFoundError('Application');
  }
}
