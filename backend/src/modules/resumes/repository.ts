import type {
  ApplicationRow,
  Database,
  ProfileRow,
  ResumeAnalysisRow,
} from '../../config/database.types.js';
import { serviceSupabase, type DatabaseClient } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { AppError, NotFoundError, throwDatabaseError } from '../../shared/errors.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ResumeAnalysisInsert = Database['public']['Tables']['resume_analyses']['Insert'];
type ResumeAnalysisUpdate = Database['public']['Tables']['resume_analyses']['Update'];

export class ResumesRepository {
  public async uploadObject(path: string, buffer: Buffer): Promise<void> {
    const { error } = await serviceSupabase.storage
      .from(env.SUPABASE_RESUME_BUCKET)
      .upload(path, buffer, {
        contentType: 'application/pdf',
        cacheControl: '0',
        upsert: false,
      });
    if (error) {
      throw new AppError(502, 'RESUME_UPLOAD_FAILED', 'Unable to store the resume');
    }
  }

  public async deleteObject(path: string): Promise<void> {
    const { error } = await serviceSupabase.storage.from(env.SUPABASE_RESUME_BUCKET).remove([path]);
    if (error) {
      throw new AppError(502, 'RESUME_DELETE_FAILED', 'Unable to remove the resume');
    }
  }

  public async downloadObject(path: string): Promise<Buffer> {
    const { data, error } = await serviceSupabase.storage
      .from(env.SUPABASE_RESUME_BUCKET)
      .download(path);
    if (error || !data) {
      throw new NotFoundError('Resume file');
    }
    return Buffer.from(await data.arrayBuffer());
  }

  public async findProfile(client: DatabaseClient, userId: string): Promise<ProfileRow> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the profile');
    if (!data) throw new NotFoundError('Profile');
    return data;
  }

  public async findApplication(
    client: DatabaseClient,
    applicationId: string,
  ): Promise<ApplicationRow> {
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load the application resume');
    if (!data) throw new NotFoundError('Application');
    return data;
  }

  public async updateProfile(
    client: DatabaseClient,
    userId: string,
    update: ProfileUpdate,
  ): Promise<ProfileRow> {
    const { data, error } = await client
      .from('profiles')
      .update(update)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throwDatabaseError(error, 'Unable to update the resume profile');
    if (!data) throw new NotFoundError('Profile');
    return data;
  }

  public async createAnalysis(input: ResumeAnalysisInsert): Promise<ResumeAnalysisRow> {
    const { data, error } = await serviceSupabase
      .from('resume_analyses')
      .insert(input)
      .select('*')
      .single();
    if (error) throwDatabaseError(error, 'Unable to create resume analysis');
    if (!data) throw new NotFoundError('Resume analysis');
    return data;
  }

  public async findAnalysisByPath(
    client: DatabaseClient,
    userId: string,
    path: string,
  ): Promise<ResumeAnalysisRow> {
    const { data, error } = await client
      .from('resume_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('storage_path', path)
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to load resume analysis');
    if (!data) throw new NotFoundError('Resume analysis');
    return data;
  }

  public async updateAnalysis(
    userId: string,
    analysisId: string,
    update: ResumeAnalysisUpdate,
  ): Promise<ResumeAnalysisRow> {
    const { data, error } = await serviceSupabase
      .from('resume_analyses')
      .update(update)
      .eq('id', analysisId)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throwDatabaseError(error, 'Unable to update resume analysis');
    if (!data) throw new NotFoundError('Resume analysis');
    return data;
  }
}
