import type { PaginatedResult } from '../../shared/pagination.js';
import { toPaginatedResult } from '../../shared/pagination.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { NotificationsRepository } from './repository.js';
import type { NotificationListInput, NotificationView } from './types.js';
import { toNotificationView } from './types.js';

export class NotificationsService {
  public constructor(private readonly repository: NotificationsRepository) {}

  public async list(
    context: AuthenticatedContext,
    input: NotificationListInput,
  ): Promise<PaginatedResult<NotificationView>> {
    const result = await this.repository.list(context.client, context.user.id, input);
    return toPaginatedResult(result.rows.map(toNotificationView), result.total, input);
  }

  public async markRead(
    context: AuthenticatedContext,
    notificationId: string,
  ): Promise<NotificationView> {
    return toNotificationView(
      await this.repository.markRead(context.client, context.user.id, notificationId),
    );
  }

  public async markAllRead(context: AuthenticatedContext): Promise<number> {
    return this.repository.markAllRead(context.client, context.user.id);
  }

  public async remove(context: AuthenticatedContext, notificationId: string): Promise<void> {
    await this.repository.remove(context.client, context.user.id, notificationId);
  }
}
