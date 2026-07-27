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
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
