import type { Database } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class ProfilesRepository {
  public async findByUserId(client: DatabaseClient, userId: string) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throwDatabaseError(error, 'Unable to load the profile');
    }
    if (!data) {
      throw new NotFoundError('Profile');
    }
    return data;
  }

  public async findById(client: DatabaseClient, profileId: string) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      throwDatabaseError(error, 'Unable to load the profile');
    }
    if (!data) {
      throw new NotFoundError('Profile');
    }
    return data;
  }

  public async updateByUserId(client: DatabaseClient, userId: string, update: ProfileUpdate) {
    const { data, error } = await client
      .from('profiles')
      .update(update)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throwDatabaseError(error, 'Unable to update the profile');
    }
    if (!data) {
      throw new NotFoundError('Profile');
    }
    return data;
  }
}
