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
    <main className="relative min-h-[calc(100dvh-4rem)] min-w-0 overflow-hidden bg-background py-8 text-foreground transition-colors duration-300 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/20"
      />
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-md overflow-hidden border bg-card text-card-foreground shadow-xl dark:border-slate-800">
          <div className="border-b bg-muted/40 p-5 text-foreground dark:bg-slate-900/90 dark:text-white sm:p-6">
            <Logo className="text-lg" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
              {description}
            </p>
          </div>
          <div className="p-5 sm:p-8">{children}</div>
          <div className="border-t bg-muted/30 px-5 py-4 text-center text-sm text-muted-foreground dark:bg-slate-900/50 sm:px-6">
            {footer}
          </div>
        </Card>
      </div>
    </main>
  );
}
