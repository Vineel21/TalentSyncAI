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
    <Card className="group relative overflow-hidden border bg-card p-5 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 sm:p-6">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {helper ? (
            <p className="mt-1 text-xs text-muted-foreground font-medium">{helper}</p>
          ) : null}
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 transition-transform group-hover:scale-110">
          <Icon aria-hidden="true" className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
