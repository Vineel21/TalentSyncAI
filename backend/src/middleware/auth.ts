import type { RequestHandler } from 'express';
import type { UserRole } from '../config/database.types.js';
import { createUserClient } from '../config/supabase.js';
import { createAnonymousClient } from '../config/supabase.js';
import type { AuthRepository } from '../modules/auth/repository.js';
import { AuthenticationError, AuthorizationError } from '../shared/errors.js';

const readBearerToken = (authorization: string | undefined): string => {
  if (!authorization) {
    throw new AuthenticationError();
  }
  const [scheme, token, extra] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    throw new AuthenticationError(
      'Use a valid Bearer access token',
      'INVALID_AUTHORIZATION_HEADER',
    );
  }
  return token;
};

export const createAuthenticate = (repository: AuthRepository): RequestHandler => {
  return async (request, _response, next): Promise<void> => {
    try {
      const accessToken = readBearerToken(request.header('authorization'));
      const authUser = await repository.verifyAccessToken(accessToken);
      const client = createUserClient(accessToken);
      const user = await repository.findTrustedUser(client, authUser.id);

      request.auth = {
        accessToken,
        client,
        user,
      };
      request.databaseClient = client;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const createOptionalAuthenticate = (repository: AuthRepository): RequestHandler => {
  return async (request, _response, next): Promise<void> => {
    try {
      const authorization = request.header('authorization');
      if (!authorization) {
        request.databaseClient = createAnonymousClient();
        next();
        return;
      }

      const accessToken = readBearerToken(authorization);
      const authUser = await repository.verifyAccessToken(accessToken);
      const client = createUserClient(accessToken);
      const user = await repository.findTrustedUser(client, authUser.id);
      request.auth = { accessToken, client, user };
      request.databaseClient = client;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (request, _response, next): void => {
    if (!request.auth) {
      next(new AuthenticationError());
      return;
    }
    if (!roles.includes(request.auth.user.role)) {
      next(new AuthorizationError());
      return;
    }
    next();
  };
};
