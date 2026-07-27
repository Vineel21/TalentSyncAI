import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  unread: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationIdParamsSchema = z.object({
  id: z.uuid(),
});

export const notificationReadSchema = z.object({
  notificationId: z.uuid(),
});
