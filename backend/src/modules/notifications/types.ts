import type { NotificationKind, NotificationRow } from '../../config/database.types.js';
import type { PaginationInput } from '../../shared/pagination.js';

export interface NotificationListInput extends PaginationInput {
  unread?: boolean;
}

export interface NotificationView {
  id: string;
  kind: NotificationKind;
  applicationId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const toNotificationView = (notification: NotificationRow): NotificationView => ({
  id: notification.id,
  kind: notification.kind,
  applicationId: notification.application_id,
  title: notification.title,
  message: notification.message,
  isRead: notification.is_read,
  readAt: notification.read_at,
  createdAt: notification.created_at,
});
