import type { UserRow } from '../config/database.types.js';
import type { DatabaseClient } from '../config/supabase.js';

export interface AuthenticatedContext {
  client: DatabaseClient;
  accessToken: string;
  user: UserRow;
}
