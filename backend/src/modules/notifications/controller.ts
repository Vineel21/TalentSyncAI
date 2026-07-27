import type { Request, Response } from 'express';
import { validatedParams, validatedQuery } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { NotificationsService } from './service.js';
import type { NotificationListInput } from './types.js';

export class NotificationsController {
  public constructor(private readonly service: NotificationsService) {}

  public list = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const data = await this.service.list(
      request.auth,
      validatedQuery<NotificationListInput>(request),
    );
    return sendSuccess(response, 200, 'Notifications retrieved', data);
  };

  public markRead = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const params = request.validated?.params as { id?: string } | undefined;
    const body = request.validated?.body as { notificationId?: string } | undefined;
    const notificationId = params?.id ?? body?.notificationId;
    if (!notificationId) throw new AuthenticationError('Notification id is required');
    const notification = await this.service.markRead(request.auth, notificationId);
    return sendSuccess(response, 200, 'Notification marked as read', {
      notification,
    });
  };

  public markAllRead = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const updated = await this.service.markAllRead(request.auth);
    return sendSuccess(response, 200, 'All notifications marked as read', {
      updated,
    });
  };

  public remove = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    await this.service.remove(request.auth, id);
    return sendSuccess(response, 200, 'Notification deleted', null);
  };
}
