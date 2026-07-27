import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/features/shared/toast-provider';
import { errorMessage } from '@/lib/utils';
import { savedJobService } from '@/services/saved-job.service';
import type { Job, SavedJob } from '@/types/api';

export const savedJobsQueryKey = ['saved-jobs'] as const;

export function useSavedJobs() {
  return useQuery({
    queryKey: savedJobsQueryKey,
    queryFn: savedJobService.list,
  });
}

export function SaveJobButton({
  job,
  savedJobs,
  className,
}: {
  job: Job;
  savedJobs: SavedJob[] | undefined;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const saved = savedJobs?.some((item) => item.job.id === job.id) ?? false;
  const toggle = useMutation({
    mutationFn: async (): Promise<SavedJob | null> => {
      if (saved) {
        await savedJobService.remove(job.id);
        return null;
      }
      return savedJobService.save(job.id);
    },
    onSuccess: (savedJob) => {
      queryClient.setQueryData<SavedJob[]>(savedJobsQueryKey, (current = []) =>
        saved
          ? current.filter((item) => item.job.id !== job.id)
          : savedJob
            ? [...current.filter((item) => item.job.id !== job.id), savedJob]
            : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'candidate'] });
      toast.success(saved ? 'Removed from saved jobs' : 'Job saved');
    },
    onError: (error) => toast.error('Couldn’t update saved jobs', errorMessage(error)),
  });

  return (
    <Button
      aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
      aria-pressed={saved}
      className={className}
      disabled={!savedJobs}
      isLoading={toggle.isPending}
      onClick={() => toggle.mutate()}
      size="sm"
      type="button"
      variant={saved ? 'secondary' : 'outline'}
    >
      {saved ? (
        <BookmarkCheck aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Bookmark aria-hidden="true" className="h-4 w-4" />
      )}
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
