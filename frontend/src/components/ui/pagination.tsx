import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="outline">
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Previous
      </Button>
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="outline"
      >
        Next
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </nav>
  );
}
