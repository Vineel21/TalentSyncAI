import type { Database, JobRow, SavedJobRow } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import type { SavedJobRecord } from './types.js';

type SavedJobInsert = Database['public']['Tables']['saved_jobs']['Insert'];

export class SavedJobsRepository {
  public async list(
    client: DatabaseClient,
    candidateId: string,
    limit = 100,
  ): Promise<SavedJobRecord[]> {
    const savedResult = await client
      .from('saved_jobs')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (savedResult.error) throwDatabaseError(savedResult.error, 'Unable to load saved jobs');

    const savedJobs = savedResult.data ?? [];
    const jobIds = savedJobs.map((savedJob) => savedJob.job_id);
    if (jobIds.length === 0) return [];

    const jobsResult = await client
      .from('jobs')
      .select('*')
      .in('id', jobIds)
      .is('deleted_at', null);
    if (jobsResult.error) throwDatabaseError(jobsResult.error, 'Unable to load saved job details');

    const jobsById = new Map((jobsResult.data ?? []).map((job) => [job.id, job]));
    return savedJobs.flatMap((savedJob) => {
      const job = jobsById.get(savedJob.job_id);
      return job ? [{ savedJob, job }] : [];
    });
  }

  public async find(
    client: DatabaseClient,
    candidateId: string,
    jobId: string,
  ): Promise<SavedJobRow | null> {
    const { data, error } = await client
      .from('saved_jobs')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the saved job');
    return data;
  }

  public async findOpenJob(client: DatabaseClient, jobId: string, now: string): Promise<JobRow> {
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'open')
      .is('deleted_at', null)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the job');
    if (!data) throw new NotFoundError('Open job');
    return data;
  }

  public async save(
    client: DatabaseClient,
    candidateId: string,
    jobId: string,
  ): Promise<SavedJobRow> {
    const insert: SavedJobInsert = {
      candidate_id: candidateId,
      job_id: jobId,
    };
    const { data, error } = await client
      .from('saved_jobs')
      .upsert(insert, {
        onConflict: 'candidate_id,job_id',
        ignoreDuplicates: true,
      })
      .select('*')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to save the job');
    if (data) return data;

    const existing = await this.find(client, candidateId, jobId);
    if (!existing) throw new NotFoundError('Saved job');
    return existing;
  }

  public async remove(client: DatabaseClient, candidateId: string, jobId: string): Promise<void> {
    const { data, error } = await client
      .from('saved_jobs')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .select('job_id')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to remove the saved job');
    if (!data) throw new NotFoundError('Saved job');
  }
}
