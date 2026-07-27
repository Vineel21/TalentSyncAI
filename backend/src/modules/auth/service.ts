import { AuthenticationError } from '../../shared/errors.js';
import type { UserRow } from '../../config/database.types.js';
import type { AuthRepository } from './repository.js';
import type { AuthData, AuthSessionResult, LoginInput, RegisterInput } from './types.js';
import { toPublicUser } from './types.js';

export class AuthService {
  public constructor(private readonly repository: AuthRepository) {}

  public async register(input: RegisterInput): Promise<AuthSessionResult> {
    const result = await this.repository.register(input);

    if (!result.accessToken) {
      return {
        user: {
          id: result.authUser.id,
          email: result.authUser.email ?? input.email,
          role: input.role,
        },
        accessToken: null,
        refreshToken: null,
      };
    }

    const trustedUser = await this.repository.findTrustedUserForAuth(
      result.authUser,
      result.accessToken,
      input.role,
    );

    return {
      user: toPublicUser(trustedUser),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  public async login(input: LoginInput): Promise<AuthSessionResult> {
    const result = await this.repository.login(input);
    if (!result.accessToken) {
      throw new AuthenticationError('Login did not create a valid session', 'SESSION_NOT_CREATED');
    }

    const trustedUser = await this.repository.findTrustedUserForAuth(
      result.authUser,
      result.accessToken,
    );

    return {
      user: toPublicUser(trustedUser),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  public async refresh(refreshToken: string | undefined): Promise<AuthSessionResult> {
    if (!refreshToken) {
      throw new AuthenticationError('A refresh token cookie is required', 'REFRESH_TOKEN_REQUIRED');
    }

    const result = await this.repository.refresh(refreshToken);
    if (!result.accessToken) {
      throw new AuthenticationError(
        'Refresh did not create a valid session',
        'SESSION_NOT_CREATED',
      );
    }

    const trustedUser = await this.repository.findTrustedUserForAuth(
      result.authUser,
      result.accessToken,
    );

    return {
      user: toPublicUser(trustedUser),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  public async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      try {
        await this.repository.logout(refreshToken);
      } catch {
        // Logout is idempotent: an invalid/expired refresh token is already unusable.
      }
    }
  }

  public me(user: UserRow): AuthData {
    return {
      user: toPublicUser(user),
      accessToken: null,
    };
  }
}
