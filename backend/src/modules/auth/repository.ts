import type { User } from '@supabase/supabase-js';
import type { UserRow, UserRole } from '../../config/database.types.js';
import {
  createAnonymousClient,
  createUserClient,
  type DatabaseClient,
} from '../../config/supabase.js';
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  throwDatabaseError,
} from '../../shared/errors.js';
import type { LoginInput, RegisterInput } from './types.js';

interface SupabaseAuthResult {
  authUser: User;
  accessToken: string | null;
  refreshToken: string | null;
}

export class AuthRepository {
  public async register(input: RegisterInput): Promise<SupabaseAuthResult> {
    const client = createAnonymousClient();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          requested_role: input.role,
          full_name: input.fullName,
        },
      },
    });

    if (error || !data.user) {
      if (error?.message.toLowerCase().includes('already')) {
        throw new AppError(
          409,
          'EMAIL_ALREADY_REGISTERED',
          'An account with this email already exists',
        );
      }
      throw new AppError(400, 'REGISTRATION_FAILED', error?.message ?? 'Registration failed');
    }

    return {
      authUser: data.user,
      accessToken: data.session?.access_token ?? null,
      refreshToken: data.session?.refresh_token ?? null,
    };
  }

  public async login(input: LoginInput): Promise<SupabaseAuthResult> {
    const client = createAnonymousClient();
    const { data, error } = await client.auth.signInWithPassword(input);

    if (error || !data.user || !data.session) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    return {
      authUser: data.user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  public async refresh(refreshToken: string): Promise<SupabaseAuthResult> {
    const client = createAnonymousClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.user || !data.session) {
      throw new AuthenticationError(
        'Your session is invalid or has expired',
        'INVALID_REFRESH_TOKEN',
      );
    }

    return {
      authUser: data.user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  public async logout(refreshToken: string): Promise<void> {
    const client = createAnonymousClient();
    const { error: sessionError } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw new AuthenticationError('Your session is invalid or has expired', 'INVALID_SESSION');
    }

    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) {
      throw new AppError(502, 'LOGOUT_FAILED', 'Unable to end the session');
    }
  }

  public async verifyAccessToken(accessToken: string): Promise<User> {
    const client = createAnonymousClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new AuthenticationError(
        'Your access token is invalid or has expired',
        'INVALID_ACCESS_TOKEN',
      );
    }

    return data.user;
  }

  public async findTrustedUser(client: DatabaseClient, userId: string): Promise<UserRow> {
    const { data, error } = await client.from('users').select('*').eq('id', userId).maybeSingle();

    if (error) {
      throwDatabaseError(error, 'Unable to load the authenticated user');
    }
    if (!data) {
      throw new NotFoundError('User account');
    }

    return data;
  }

  public async findTrustedUserForAuth(
    authUser: User,
    accessToken: string,
    requestedRole?: UserRole,
  ): Promise<UserRow> {
    const client = createUserClient(accessToken);
    const existing = await this.findTrustedUser(client, authUser.id);

    if (requestedRole && existing.role !== requestedRole) {
      throw new AppError(
        409,
        'ROLE_MISMATCH',
        'The registered account role does not match the requested role',
      );
    }

    return existing;
  }
}
