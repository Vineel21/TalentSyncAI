import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { JobForm } from '@/features/jobs/job-form';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';
import { jobService, type JobInput } from '@/services/job.service';

export function JobEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  useDocumentTitle(isEditing ? 'Edit job' : 'Create job');
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const job = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobService.get(id ?? ''),
    enabled: isEditing,
  });
  const save = useMutation({
    mutationFn: (input: JobInput) => (id ? jobService.update(id, input) : jobService.create(input)),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        isEditing ? 'Job updated' : 'Job created',
        result.status === 'open'
          ? 'The role is visible to candidates.'
          : 'The role is saved in your workspace.',
      );
      navigate('/recruiter/jobs');
    },
    onError: (error) => toast.error('Couldn’t save job', errorMessage(error)),
  });

  if (job.isLoading) return <PageLoading label="Loading job editor" />;
  if (job.isError)
    return <ErrorState message={errorMessage(job.error)} onRetry={() => void job.refetch()} />;

  return (
    <div className="space-y-7">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        to="/recruiter/jobs"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to jobs
      </Link>
      <PageHeader
        description={
          isEditing
            ? 'Update the role details, visibility, or application deadline.'
            : 'Create a clear, inclusive role that helps the right candidates understand the opportunity.'
        }
        eyebrow="Job management"
        title={isEditing ? `Edit ${job.data?.title ?? 'job'}` : 'Create a new job'}
      />
      <JobForm
        isSubmitting={save.isPending}
        job={job.data}
        onSubmit={(input) => save.mutate(input)}
      />
    </div>
  );
}
