import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage, formatDate, friendlyLabel, positiveInteger } from '@/lib/utils';
import { jobService } from '@/services/job.service';
import type { Job, JobStatus } from '@/types/api';

function RecruiterJobCard({
  job,
  deleting,
  onDelete,
  onStatus,
  statusPending,
}: {
  job: Job;
  deleting: boolean;
  onDelete: () => void;
  onStatus: (status: JobStatus) => void;
  statusPending: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{job.title}</h2>
            <Badge
              variant={
                job.status === 'open' ? 'success' : job.status === 'draft' ? 'warning' : 'secondary'
              }
            >
              {friendlyLabel(job.status)}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{job.companyName}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              Created {formatDate(job.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link className="flex items-center gap-2" to={`/recruiter/jobs/${job.id}/applicants`}>
              <Eye aria-hidden="true" className="h-4 w-4" />
              Applicants
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link className="flex items-center gap-2" to={`/recruiter/jobs/${job.id}/edit`}>
              <Edit3 aria-hidden="true" className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">
          {job.status === 'open'
            ? 'Visible to candidates'
            : job.status === 'draft'
              ? 'Only visible to your team'
              : 'No longer accepting applications'}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {job.status !== 'open' ? (
            <Button
              disabled={statusPending}
              onClick={() => onStatus('open')}
              size="sm"
              variant="outline"
            >
              Publish
            </Button>
          ) : (
            <Button
              disabled={statusPending}
              onClick={() => onStatus('closed')}
              size="sm"
              variant="outline"
            >
              Close role
            </Button>
          )}
          {confirmDelete ? (
            <>
              <Button onClick={() => setConfirmDelete(false)} size="sm" variant="ghost">
                Cancel
              </Button>
              <Button isLoading={deleting} onClick={onDelete} size="sm" variant="destructive">
                Confirm delete
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmDelete(true)} size="sm" variant="ghost">
              <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function RecruiterJobsPage() {
  useDocumentTitle('Manage jobs');
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const toast = useToast();
  const queryClient = useQueryClient();
  const status = (searchParams.get('status') ?? '') as JobStatus | '';
  const page = positiveInteger(searchParams.get('page'));
  const jobs = useQuery({
    queryKey: ['jobs', 'recruiter', Object.fromEntries(searchParams)],
    queryFn: () =>
      jobService.list({
        search: searchParams.get('search') ?? undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });
  const remove = useMutation({
    mutationFn: jobService.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Job deleted');
    },
    onError: (error) => toast.error('Couldn’t delete job', errorMessage(error)),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: JobStatus }) =>
      jobService.updateStatus(id, nextStatus),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(variables.nextStatus === 'open' ? 'Job published' : 'Job closed');
    },
    onError: (error) => toast.error('Couldn’t update job', errorMessage(error)),
  });

  return (
    <div className="space-y-7">
      <PageHeader
        description="Create, publish, and review the roles owned by your hiring team."
        eyebrow="Job management"
        title="Your jobs"
        action={
          <Button asChild>
            <Link className="flex items-center gap-2" to="/recruiter/jobs/new">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Create job
            </Link>
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(searchParams);
            if (search.trim()) next.set('search', search.trim());
            else next.delete('search');
            next.delete('page');
            setSearchParams(next);
          }}
        >
          <Input
            aria-label="Search your jobs"
            className="flex-1"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or company"
            value={search}
          />
          <Button type="submit">
            <Search aria-hidden="true" className="h-4 w-4" />
            Search
          </Button>
        </form>
        <Select
          aria-label="Filter jobs by status"
          className="md:w-48"
          onChange={(event) => {
            const next = new URLSearchParams(searchParams);
            if (event.target.value) next.set('status', event.target.value);
            else next.delete('status');
            next.delete('page');
            setSearchParams(next);
          }}
          value={status}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </Select>
      </Card>

      {jobs.isLoading ? (
        <PageLoading label="Loading recruiter jobs" />
      ) : jobs.isError ? (
        <ErrorState message={errorMessage(jobs.error)} onRetry={() => void jobs.refetch()} />
      ) : !jobs.data ? (
        <PageLoading label="Loading recruiter jobs" />
      ) : jobs.data.items.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link to="/recruiter/jobs/new">Create a job</Link>
            </Button>
          }
          description={
            searchParams.size
              ? 'Try clearing your search or status filter.'
              : 'Create your first role to start receiving applications.'
          }
          icon={BriefcaseBusiness}
          title={searchParams.size ? 'No matching jobs' : 'No jobs created yet'}
        />
      ) : (
        <>
          <div className="space-y-4">
            {jobs.data.items.map((job) => (
              <RecruiterJobCard
                deleting={remove.isPending && remove.variables === job.id}
                job={job}
                key={job.id}
                onDelete={() => remove.mutate(job.id)}
                onStatus={(nextStatus) => updateStatus.mutate({ id: job.id, nextStatus })}
                statusPending={updateStatus.isPending && updateStatus.variables?.id === job.id}
              />
            ))}
          </div>
          <Pagination
            page={jobs.data.pagination.page}
            totalPages={jobs.data.pagination.totalPages}
            onPageChange={(nextPage) => {
              const next = new URLSearchParams(searchParams);
              next.set('page', String(nextPage));
              setSearchParams(next);
            }}
          />
        </>
      )}
    </div>
  );
}
