import type {
  AiAnalysisRow,
  ApplicationRow,
  Database,
  JobRow,
  ProfileRow,
} from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { serviceSupabase } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import { toGeminiConsentReceipt, type GeminiConsentReceipt } from './consent.js';
import { resumeParseResultSchema, type ResumeParseResult } from './types.js';

type AnalysisInsert = Database['public']['Tables']['ai_analyses']['Insert'];
type AnalysisUpdate = Database['public']['Tables']['ai_analyses']['Update'];

export interface ApplicationBundle {
  application: ApplicationRow;
  job: JobRow;
  profile: ProfileRow;
  resumeText: string | null;
  resumeSnapshot: ResumeParseResult | null;
  resumeConsent: GeminiConsentReceipt | null;
}

export interface MatchBundle {
  job: JobRow;
  profile: ProfileRow;
  resumeConsent: GeminiConsentReceipt | null;
}

const validatedResumeSnapshot = (
  status: string | undefined,
  parsedData: unknown,
): ResumeParseResult | null => {
  if (status !== 'completed') return null;
  const parsed = resumeParseResultSchema.safeParse(parsedData);
  return parsed.success ? parsed.data : null;
};

export class AiRepository {
  public async getCandidateJobBundle(
    client: DatabaseClient,
    candidateId: string,
    jobId: string,
  ): Promise<MatchBundle> {
    const [jobResult, profileResult] = await Promise.all([
      client
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .is('deleted_at', null)
        .maybeSingle(),
      client.from('profiles').select('*').eq('user_id', candidateId).maybeSingle(),
    ]);
    if (jobResult.error) throwDatabaseError(jobResult.error, 'Unable to load the job');
    if (profileResult.error) {
      throwDatabaseError(profileResult.error, 'Unable to load the candidate profile');
    }
    if (!jobResult.data) throw new NotFoundError('Open job');
    if (!profileResult.data) throw new NotFoundError('Candidate profile');

    let resumeConsent: GeminiConsentReceipt | null = null;
    if (profileResult.data.resume_path) {
      const resumeResult = await client
        .from('resume_analyses')
        .select('gemini_consent_version, gemini_consented_at')
        .eq('user_id', candidateId)
        .eq('storage_path', profileResult.data.resume_path)
        .maybeSingle();
      if (resumeResult.error) {
        throwDatabaseError(resumeResult.error, 'Unable to load resume consent');
      }
      resumeConsent = toGeminiConsentReceipt(resumeResult.data);
    }

    return { job: jobResult.data, profile: profileResult.data, resumeConsent };
  }
  public async getApplicationBundle(
    client: DatabaseClient,
    applicationId: string,
  ): Promise<ApplicationBundle> {
    const applicationResult = await client
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationResult.error) {
      throwDatabaseError(applicationResult.error, 'Unable to load the application');
    }
    if (!applicationResult.data) throw new NotFoundError('Application');

    const [jobResult, profileResult] = await Promise.all([
      client.from('jobs').select('*').eq('id', applicationResult.data.job_id).maybeSingle(),
      client
        .from('profiles')
        .select('*')
        .eq('user_id', applicationResult.data.candidate_id)
        .maybeSingle(),
    ]);
    if (jobResult.error) throwDatabaseError(jobResult.error, 'Unable to load the job');
    if (profileResult.error) {
      throwDatabaseError(profileResult.error, 'Unable to load the candidate profile');
    }
    if (!jobResult.data) throw new NotFoundError('Job');
    if (!profileResult.data) throw new NotFoundError('Candidate profile');

    const resumeResult = await client
      .from('resume_analyses')
      .select('status, extracted_text, parsed_data, gemini_consent_version, gemini_consented_at')
      .eq('user_id', applicationResult.data.candidate_id)
      .eq('storage_path', applicationResult.data.resume_path)
      .maybeSingle();
    if (resumeResult.error) {
      throwDatabaseError(resumeResult.error, 'Unable to load resume analysis');
    }

    return {
      application: applicationResult.data,
      job: jobResult.data,
      profile: profileResult.data,
      resumeText: resumeResult.data?.extracted_text ?? null,
      resumeSnapshot: validatedResumeSnapshot(
        resumeResult.data?.status,
        resumeResult.data?.parsed_data,
      ),
      resumeConsent: toGeminiConsentReceipt(resumeResult.data),
    };
  }

  public async beginAnalysis(applicationId: string, model: string): Promise<AiAnalysisRow> {
    const insert: AnalysisInsert = {
      application_id: applicationId,
      status: 'processing',
      model,
      error_message: null,
      completed_at: null,
    };
    const { data, error } = await serviceSupabase
      .from('ai_analyses')
      .upsert(insert, { onConflict: 'application_id' })
      .select('*')
      .single();
    if (error) throwDatabaseError(error, 'Unable to start AI analysis');
    if (!data) throw new NotFoundError('AI analysis');
    return data;
  }

  public async updateAnalysis(
    applicationId: string,
    update: AnalysisUpdate,
  ): Promise<AiAnalysisRow> {
    const { data, error } = await serviceSupabase
      .from('ai_analyses')
      .update(update)
      .eq('application_id', applicationId)
      .select('*')
      .single();
    if (error) throwDatabaseError(error, 'Unable to save AI analysis');
    if (!data) throw new NotFoundError('AI analysis');
    return data;
  }

  public async updateMatchScore(applicationId: string, score: number): Promise<void> {
    const { error } = await serviceSupabase
      .from('applications')
      .update({ ai_match_score: score })
      .eq('id', applicationId);
    if (error) throwDatabaseError(error, 'Unable to save the match score');
  }
}
