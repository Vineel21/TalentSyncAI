import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from './database.types.js';

const serverAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
} as const;

export type DatabaseClient = SupabaseClient<Database>;

export const createAnonymousClient = (): DatabaseClient =>
  createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: serverAuthOptions,
  });

export const createUserClient = (accessToken: string): DatabaseClient =>
  createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: serverAuthOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

export const serviceSupabase: DatabaseClient = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: serverAuthOptions },
);
