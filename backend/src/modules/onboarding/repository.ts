import type { Database, JobRow } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import type { OnboardingProfile } from './types.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const ONBOARDING_PROFILE_COLUMNS =
  'user_id, full_name, headline, location, summary, skills, education, experience, onboarding_step, onboarding_source, onboarding_completed_at, recommendations_skipped_at' as const;

export class OnboardingRepository {
  public async getProfile(client: DatabaseClient, userId: string): Promise<OnboardingProfile> {
    const { data, error } = await client
      .from('profiles')
      .select(ONBOARDING_PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throwDatabaseError(error, 'Unable to load onboarding progress');
    if (!data) throw new NotFoundError('Candidate profile');
    return data;
  }

  public async updateProfile(
    client: DatabaseClient,
    userId: string,
    update: ProfileUpdate,
  ): Promise<OnboardingProfile> {
    const { data, error } = await client
      .from('profiles')
      .update(update)
      .eq('user_id', userId)
      .select(ONBOARDING_PROFILE_COLUMNS)
      .maybeSingle();

    if (error) throwDatabaseError(error, 'Unable to update onboarding progress');
    if (!data) throw new NotFoundError('Candidate profile');
    return data;
  }

  public async listRecommendationJobs(
    client: DatabaseClient,
    before: string,
    limit = 50,
  ): Promise<JobRow[]> {
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .is('deleted_at', null)
      .or(`expires_at.is.null,expires_at.gt.${before}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throwDatabaseError(error, 'Unable to load recommendation candidates');
    return data ?? [];
  }
}
