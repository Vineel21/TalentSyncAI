import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import { validatedBody } from '../../middleware/validation.js';
import type { AuthService } from './service.js';
import type { AuthSessionResult, LoginInput, RegisterInput } from './types.js';

const REFRESH_COOKIE = 'talentsync_refresh';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth',
  domain: env.COOKIE_DOMAIN,
  maxAge: 30 * 24 * 60 * 60 * 1_000,
});

const clearCookieOptions = (): CookieOptions => {
  const options = cookieOptions();
  delete options.maxAge;
  return options;
};

const responseData = (result: AuthSessionResult) => ({
  user: result.user,
  accessToken: result.accessToken,
});

export class AuthController {
  public constructor(private readonly service: AuthService) {}

  public register = async (request: Request, response: Response): Promise<Response> => {
    const result = await this.service.register(validatedBody<RegisterInput>(request));
    if (result.refreshToken) {
      response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
    }

    const message = result.accessToken
      ? 'Account created successfully'
      : 'Account created; verify your email before signing in';
    return sendSuccess(response, 201, message, responseData(result));
  };

  public login = async (request: Request, response: Response): Promise<Response> => {
    const result = await this.service.login(validatedBody<LoginInput>(request));
    if (result.refreshToken) {
      response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
    }
    return sendSuccess(response, 200, 'Signed in successfully', responseData(result));
  };

  public refresh = async (request: Request, response: Response): Promise<Response> => {
    const result = await this.service.refresh(
      request.cookies[REFRESH_COOKIE] as string | undefined,
    );
    if (result.refreshToken) {
      response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
    }
    return sendSuccess(response, 200, 'Session refreshed successfully', responseData(result));
  };

  public logout = async (request: Request, response: Response): Promise<Response> => {
    await this.service.logout(request.cookies[REFRESH_COOKIE] as string | undefined);
    response.clearCookie(REFRESH_COOKIE, clearCookieOptions());
    return sendSuccess(response, 200, 'Signed out successfully', null);
  };

  public me = (request: Request, response: Response): Response => {
    if (!request.auth) {
      throw new AuthenticationError();
    }
    return sendSuccess(response, 200, 'Authenticated user retrieved', {
      user: this.service.me(request.auth.user).user,
    });
  };
}
