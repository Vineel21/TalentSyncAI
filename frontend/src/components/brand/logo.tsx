import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      aria-label="TalentSync AI home"
      className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}
      to="/"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 dark:shadow-none">
        <Sparkles aria-hidden="true" className="h-5 w-5" />
      </span>
      {!compact ? (
        <span>
          TalentSync <span className="text-primary">AI</span>
        </span>
      ) : null}
    </Link>
  );
}
