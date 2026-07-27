import type { LucideIcon } from 'lucide-react';
import { Card } from './card';

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-primary dark:bg-blue-950">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
