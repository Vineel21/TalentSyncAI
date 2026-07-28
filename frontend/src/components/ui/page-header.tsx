import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative flex min-w-0 flex-col justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm dark:border-slate-800 sm:flex-row sm:items-center sm:p-6">
      <div className="min-w-0">
        {eyebrow ? (
          <span className="inline-flex max-w-full items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 [&>a]:w-full [&>button]:w-full sm:w-auto sm:[&>a]:w-auto sm:[&>button]:w-auto">
          {action}
        </div>
      ) : null}
    </header>
  );
}
