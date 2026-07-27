import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApplicationCard } from '@/features/applications/application-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage, positiveInteger } from '@/lib/utils';
import { applicationService } from '@/services/application.service';
import type { ApplicationStatus } from '@/types/api';

export function ApplicationsPage() {
  useDocumentTitle('Applications');
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const status = (searchParams.get('status') ?? '') as ApplicationStatus | '';
  const page = positiveInteger(searchParams.get('page'));
  const applications = useQuery({
    queryKey: ['applications', { status, page }],
    queryFn: () => applicationService.list({ status: status || undefined, page, limit: 10 }),
  });
  const withdraw = useMutation({
    mutationFn: applicationService.withdraw,
    onSuccess: () => {
      setConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application withdrawn');
    },
    onError: (error) => toast.error('Couldn’t withdraw application', errorMessage(error)),
  });

  return (
    <div className="space-y-7">
      <PageHeader
        description="Track every application and the latest decision from the hiring team."
        eyebrow="Job search"
        title="My applications"
        action={
          <Button asChild>
            <Link className="flex items-center gap-2" to="/jobs">
              <Search aria-hidden="true" className="h-4 w-4" />
              Find jobs
            </Link>
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">Filter by current status</p>
        <Select
          aria-label="Application status"
          className="sm:w-52"
          onChange={(event) => {
            const next = new URLSearchParams();
            if (event.target.value) next.set('status', event.target.value);
            setSearchParams(next);
          }}
          value={status}
        >
          <option value="">All statuses</option>
          <option value="applied">Applied</option>
          <option value="under_review">Under review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="rejected">Rejected</option>
          <option value="offer">Offer</option>
          <option value="withdrawn">Withdrawn</option>
        </Select>
      </Card>

      {applications.isLoading ? (
        <PageLoading label="Loading applications" />
      ) : applications.isError ? (
        <ErrorState
          message={errorMessage(applications.error)}
          onRetry={() => void applications.refetch()}
        />
      ) : !applications.data ? (
        <PageLoading label="Loading applications" />
      ) : applications.data.items.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link to="/jobs">Explore open roles</Link>
            </Button>
          }
          description={
            status
              ? 'No applications currently have this status. Try viewing all statuses.'
              : 'Start exploring roles and your submitted applications will be tracked here.'
          }
          icon={FileText}
          title={status ? 'No matching applications' : 'Your application journey starts here'}
        />
      ) : (
        <>
          <div className="space-y-4">
            {applications.data.items.map((application) => (
              <div key={application.id}>
                <ApplicationCard application={application} />
                {['applied', 'under_review'].includes(application.status) ? (
                  <div className="-mt-2 flex justify-end rounded-b-xl border border-t-0 bg-card px-5 pb-4 pt-3">
                    {confirmId === application.id ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <p className="mr-2 text-sm text-muted-foreground">
                          Withdraw this application?
                        </p>
                        <Button onClick={() => setConfirmId(null)} size="sm" variant="outline">
                          Keep it
                        </Button>
                        <Button
                          isLoading={withdraw.isPending}
                          onClick={() => withdraw.mutate(application.id)}
                          size="sm"
                          variant="destructive"
                        >
                          Yes, withdraw
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setConfirmId(application.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <Pagination
            page={applications.data.pagination.page}
            totalPages={applications.data.pagination.totalPages}
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
