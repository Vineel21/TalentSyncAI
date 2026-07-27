import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
  label = 'Progress',
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={cn('h-2 overflow-hidden rounded-full bg-secondary', className)}
      role="progressbar"
    >
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-all',
          safeValue >= 90
            ? 'w-full'
            : safeValue >= 75
              ? 'w-3/4'
              : safeValue >= 50
                ? 'w-1/2'
                : safeValue >= 25
                  ? 'w-1/4'
                  : 'w-0',
        )}
      />
    </div>
  );
}
