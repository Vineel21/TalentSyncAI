import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, Notification, Paginated } from '@/types/api';

export const notificationService = {
  async list(page = 1) {
    return getData(
      (
        await api.get<ApiResponse<Paginated<Notification>>>('/notifications', {
          params: { page, limit: 20 },
        })
      ).data,
    );
  },
  async markRead(notificationIds?: string[]) {
    if (!notificationIds?.length) {
      return getData(
        (await api.patch<ApiResponse<{ updated: number }>>('/notifications/read-all')).data,
      );
    }
    const results = await Promise.all(
      notificationIds.map((notificationId) =>
        api.patch<ApiResponse<{ notification: Notification }>>('/notifications/read', {
          notificationId,
        }),
      ),
    );
    return { updated: results.length };
  },
  async remove(id: string) {
    return getData((await api.delete<ApiResponse<null>>(`/notifications/${id}`)).data);
  },
};
