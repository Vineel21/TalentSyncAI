import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Skeleton } from './skeleton';

export function PageLoading({ label = 'Loading content' }: { label?: string }) {
  return (
    <div aria-label={label} className="space-y-5" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton className="h-32" key={item} />
        ))}
      </div>
      <Skeleton className="h-72" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Card className="flex min-h-60 flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function ErrorState({
  title = 'We couldn’t load this page',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex min-h-60 flex-col items-center justify-center border-red-200 p-8 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-3 dark:bg-red-950">
        <AlertTriangle aria-hidden="true" className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="outline">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
