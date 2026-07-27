import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { cn, errorMessage, formatDate, positiveInteger } from '@/lib/utils';
import { notificationService } from '@/services/notification.service';

export function NotificationsPage() {
  useDocumentTitle('Notifications');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get('page'));
  const queryClient = useQueryClient();
  const toast = useToast();
  const notifications = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.list(page),
  });
  const read = useMutation({
    mutationFn: (ids?: string[]) => notificationService.markRead(ids),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error) => toast.error('Couldn’t update notifications', errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification removed');
    },
    onError: (error) => toast.error('Couldn’t remove notification', errorMessage(error)),
  });

  if (notifications.isLoading) return <PageLoading label="Loading notifications" />;
  if (notifications.isError)
    return (
      <ErrorState
        message={errorMessage(notifications.error)}
        onRetry={() => void notifications.refetch()}
      />
    );
  if (!notifications.data) return <PageLoading label="Loading notifications" />;

  const unread = notifications.data.items.filter((notification) => !notification.isRead);
  return (
    <div className="space-y-7">
      <PageHeader
        description="Application updates, candidate activity, and important workspace events."
        eyebrow="Inbox"
        title="Notifications"
        action={
          unread.length ? (
            <Button
              isLoading={read.isPending}
              onClick={() => read.mutate(undefined)}
              variant="outline"
            >
              <CheckCheck aria-hidden="true" className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />
      {notifications.data.items.length === 0 ? (
        <EmptyState
          description="You’re all caught up. New account and hiring activity will appear here."
          icon={Bell}
          title="No notifications"
        />
      ) : (
        <>
          <Card className="divide-y overflow-hidden">
            {notifications.data.items.map((notification) => (
              <article
                className={cn(
                  'flex gap-4 p-5',
                  !notification.isRead && 'bg-blue-50/60 dark:bg-blue-950/20',
                )}
                key={notification.id}
              >
                <button
                  aria-label={`Mark ${notification.title} as read`}
                  className={cn(
                    'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                    notification.isRead ? 'bg-slate-300' : 'bg-primary',
                  )}
                  disabled={notification.isRead}
                  onClick={() => read.mutate([notification.id])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                    <h2 className="font-semibold">{notification.title}</h2>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(notification.createdAt, {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                <Button
                  aria-label={`Delete ${notification.title}`}
                  disabled={remove.isPending && remove.variables === notification.id}
                  onClick={() => remove.mutate(notification.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </Button>
              </article>
            ))}
          </Card>
          <Pagination
            page={notifications.data.pagination.page}
            totalPages={notifications.data.pagination.totalPages}
            onPageChange={(nextPage) => setSearchParams({ page: String(nextPage) })}
          />
        </>
      )}
    </div>
  );
}
