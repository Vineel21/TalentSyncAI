import type { Database, JobRow, JobStatus } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import { toRange } from '../../shared/pagination.js';
import type { JobListInput } from './types.js';

type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export class JobsRepository {
  public async list(
    client: DatabaseClient,
    filters: JobListInput,
    user: { id: string; role: 'candidate' | 'recruiter' } | null,
  ): Promise<{ rows: JobRow[]; total: number }> {
    const [from, to] = toRange(filters);
    let query = client.from('jobs').select('*', { count: 'exact' }).is('deleted_at', null);

    if (user?.role === 'recruiter') {
      query = query.eq('recruiter_id', user.id);
      if (filters.status) query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'open');
    }
    if (filters.search) {
      query = query.textSearch('search_vector', filters.search, {
        config: 'english',
        type: 'websearch',
      });
    }
    if (filters.location) query = query.ilike('location', `%${filters.location}%`);
    if (filters.skills?.length) query = query.contains('required_skills', filters.skills);
    if (filters.employmentType) query = query.eq('employment_type', filters.employmentType);
    if (filters.salaryMin !== undefined) query = query.gte('salary_max', filters.salaryMin);
    if (filters.salaryMax !== undefined) query = query.lte('salary_min', filters.salaryMax);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throwDatabaseError(error, 'Unable to list jobs');
    }
    return { rows: data ?? [], total: count ?? 0 };
  }

  public async findById(client: DatabaseClient, jobId: string): Promise<JobRow> {
    const { data, error } = await client.from('jobs').select('*').eq('id', jobId).maybeSingle();

    if (error) throwDatabaseError(error, 'Unable to load the job');
    if (!data) throw new NotFoundError('Job');
    return data;
  }

  public async create(client: DatabaseClient, input: JobInsert): Promise<JobRow> {
    const { data, error } = await client.from('jobs').insert(input).select('*').single();
    if (error) throwDatabaseError(error, 'Unable to create the job');
    if (!data) throw new NotFoundError('Job');
    return data;
  }

  public async update(
    client: DatabaseClient,
    recruiterId: string,
    jobId: string,
    input: JobUpdate,
  ): Promise<JobRow> {
    const { data, error } = await client
      .from('jobs')
      .update(input)
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to update the job');
    if (!data) throw new NotFoundError('Job');
    return data;
  }

  public async updateStatus(
    client: DatabaseClient,
    recruiterId: string,
    jobId: string,
    status: JobStatus,
  ): Promise<JobRow> {
    return this.update(client, recruiterId, jobId, {
      status,
    });
  }

  public async softDelete(
    client: DatabaseClient,
    recruiterId: string,
    jobId: string,
  ): Promise<void> {
    const { data, error } = await client
      .from('jobs')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'closed',
      })
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to delete the job');
    if (!data) throw new NotFoundError('Job');
  }
}
