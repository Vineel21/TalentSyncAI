import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';
import { Card } from '@/components/ui/card';

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative overflow-hidden py-12 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-950/40"
      />
      <div className="container">
        <Card className="mx-auto max-w-md overflow-hidden">
          <div className="border-b bg-slate-950 p-6 text-white">
            <Logo className="text-lg" />
            <h1 className="mt-7 text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <div className="p-6">{children}</div>
          <div className="border-t bg-muted/40 px-6 py-4 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </Card>
      </div>
    </main>
  );
}
