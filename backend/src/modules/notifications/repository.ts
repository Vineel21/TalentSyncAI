import type { NotificationRow } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import { NotFoundError, throwDatabaseError } from '../../shared/errors.js';
import { toRange } from '../../shared/pagination.js';
import type { NotificationListInput } from './types.js';

export class NotificationsRepository {
  public async list(
    client: DatabaseClient,
    userId: string,
    input: NotificationListInput,
  ): Promise<{ rows: NotificationRow[]; total: number }> {
    const [from, to] = toRange(input);
    let query = client.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId);
    if (input.unread !== undefined) query = query.eq('is_read', !input.unread ? true : false);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throwDatabaseError(error, 'Unable to list notifications');
    return { rows: data ?? [], total: count ?? 0 };
  }

  public async markRead(
    client: DatabaseClient,
    userId: string,
    notificationId: string,
  ): Promise<NotificationRow> {
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to mark the notification as read');
    if (!data) throw new NotFoundError('Notification');
    return data;
  }

  public async markAllRead(client: DatabaseClient, userId: string): Promise<number> {
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');
    if (error) throwDatabaseError(error, 'Unable to mark notifications as read');
    return data?.length ?? 0;
  }

  public async remove(
    client: DatabaseClient,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const { data, error } = await client
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) throwDatabaseError(error, 'Unable to delete the notification');
    if (!data) throw new NotFoundError('Notification');
  }
}
