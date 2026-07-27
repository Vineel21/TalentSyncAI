import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileSearch,
  MapPin,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { statusVariant } from '@/features/applications/application-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage, formatDate, friendlyLabel, initials, positiveInteger } from '@/lib/utils';
import { applicationService } from '@/services/application.service';
import { aiService } from '@/services/ai.service';
import { jobService } from '@/services/job.service';
import { resumeService } from '@/services/resume.service';
import type { Application, ApplicationStatus } from '@/types/api';

const recruiterStatuses: ApplicationStatus[] = [
  'under_review',
  'shortlisted',
  'interview',
  'rejected',
  'offer',
];

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ['under_review', 'shortlisted', 'rejected'],
  under_review: ['shortlisted', 'interview', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  rejected: [],
  offer: [],
  withdrawn: [],
};

function CandidateDetails({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const candidate = application.candidateProfile;
  const toast = useToast();
  const queryClient = useQueryClient();
  const match = useMutation({
    mutationFn: () => aiService.applicationMatchScore(application.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Match analysis generated');
    },
    onError: (error) => toast.error('Couldn’t generate match analysis', errorMessage(error)),
  });
  const summary = useMutation({
    mutationFn: () => aiService.candidateSummary(application.id),
    onSuccess: () => toast.success('Candidate summary generated'),
    onError: (error) => toast.error('Couldn’t generate candidate summary', errorMessage(error)),
  });
  const download = useMutation({
    mutationFn: () => resumeService.download(application.id),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate?.fullName?.replace(/\s+/g, '-').toLowerCase() ?? 'candidate'}-resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error('Couldn’t download resume', errorMessage(error)),
  });
  const matchScore = match.data?.score ?? application.aiMatchScore;
  return (
    <div
      aria-labelledby="candidate-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
      role="dialog"
    >
      <button aria-label="Close candidate details" className="absolute inset-0" onClick={onClose} />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-background p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials(candidate?.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold" id="candidate-details-title">
                {candidate?.fullName ?? 'Candidate profile'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate?.headline ?? 'No professional headline'}
              </p>
            </div>
          </div>
          <Button
            aria-label="Close candidate details"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {candidate?.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {candidate.location}
            </span>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI match score
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {matchScore !== null && matchScore !== undefined ? `${matchScore}%` : 'Not scored'}
            </p>
            <Button
              className="mt-3"
              isLoading={match.isPending}
              onClick={() => match.mutate()}
              size="sm"
              variant="outline"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {matchScore === null || matchScore === undefined ? 'Generate' : 'Refresh'}
            </Button>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Application status
            </p>
            <Badge className="mt-3" variant={statusVariant(application.status)}>
              {friendlyLabel(application.status)}
            </Badge>
          </Card>
        </div>
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              {summary.data || application.analysis?.candidateSummary
                ? 'AI candidate summary'
                : 'Professional summary'}
            </h3>
            <Button
              isLoading={summary.isPending}
              onClick={() => summary.mutate()}
              size="sm"
              variant="outline"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Generate AI summary
            </Button>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {summary.data?.summary ??
              application.analysis?.candidateSummary ??
              candidate?.summary ??
              'No summary is available for this candidate.'}
          </p>
          {summary.data || application.analysis?.candidateSummary ? (
            <p className="mt-3 text-xs text-muted-foreground">
              AI-generated summaries should be verified against the candidate’s profile and resume.
            </p>
          ) : null}
        </section>
        <section className="mt-8">
          <h3 className="text-lg font-bold">Skills</h3>
          {candidate?.skills.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No skills listed.</p>
          )}
        </section>
        {match.data?.matchingSkills.length || application.analysis?.matchingSkills?.length ? (
          <section className="mt-8">
            <h3 className="text-lg font-bold">Match signals</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(match.data?.matchingSkills ?? application.analysis?.matchingSkills ?? []).map(
                (skill) => (
                  <Badge key={skill} variant="success">
                    {skill}
                  </Badge>
                ),
              )}
            </div>
            {match.data?.rationale ? (
              <p className="mt-3 text-sm text-muted-foreground">{match.data.rationale}</p>
            ) : null}
          </section>
        ) : null}
        {application.coverLetter ? (
          <section className="mt-8">
            <h3 className="text-lg font-bold">Candidate note</h3>
            <p className="mt-3 whitespace-pre-line rounded-xl bg-muted p-4 text-sm leading-7">
              {application.coverLetter}
            </p>
          </section>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button isLoading={download.isPending} onClick={() => download.mutate()}>
            <Download aria-hidden="true" className="h-4 w-4" />
            Download submitted resume
          </Button>
          {candidate?.linkedinUrl ? (
            <Button asChild variant="outline">
              <a
                className="flex items-center gap-2"
                href={candidate.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                LinkedIn <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          {candidate?.portfolioUrl ? (
            <Button asChild variant="outline">
              <a
                className="flex items-center gap-2"
                href={candidate.portfolioUrl}
                rel="noreferrer"
                target="_blank"
              >
                Portfolio <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function ApplicantsPage() {
  const { id: jobId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Application | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const status = (searchParams.get('status') ?? '') as ApplicationStatus | '';
  const page = positiveInteger(searchParams.get('page'));
  const job = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobService.get(jobId ?? ''),
    enabled: Boolean(jobId),
  });
  const applications = useQuery({
    queryKey: ['applications', 'recruiter', { jobId, status, page }],
    queryFn: () => applicationService.list({ jobId, status: status || undefined, page, limit: 12 }),
  });
  useDocumentTitle(job.data ? `${job.data.title} applicants` : 'Applicants');
  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ApplicationStatus }) =>
      applicationService.updateStatus(id, nextStatus),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selected?.id === updated.id) setSelected(updated);
      toast.success('Candidate status updated', `Moved to ${friendlyLabel(updated.status)}.`);
    },
    onError: (error) => toast.error('Couldn’t update status', errorMessage(error)),
  });

  if (job.isLoading || applications.isLoading) return <PageLoading label="Loading applicants" />;
  if (job.isError || applications.isError)
    return (
      <ErrorState
        message={errorMessage(job.error ?? applications.error)}
        onRetry={() => {
          void job.refetch();
          void applications.refetch();
        }}
      />
    );
  if (!applications.data) return <PageLoading label="Loading applicants" />;

  return (
    <div className="space-y-7">
      {jobId ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          to="/recruiter/jobs"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to jobs
        </Link>
      ) : null}
      <PageHeader
        description={
          job.data
            ? `Review and move candidates through the ${job.data.title} pipeline.`
            : 'Review candidates across every role in your hiring pipeline.'
        }
        eyebrow="Candidate pipeline"
        title={job.data ? `${job.data.title} applicants` : 'All applicants'}
      />
      <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {applications.data.pagination.total}
          </span>{' '}
          candidates in this view
        </p>
        <Select
          aria-label="Filter applicants by status"
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

      {applications.data.items.length === 0 ? (
        <EmptyState
          description={
            status
              ? 'No candidates currently have this status.'
              : 'Applicants will appear here as candidates apply to your open roles.'
          }
          icon={FileSearch}
          title={status ? 'No matching applicants' : 'No applicants yet'}
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {applications.data.items.map((application) => (
              <Card className="p-5" key={application.id}>
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-primary dark:bg-blue-950">
                    {initials(application.candidateProfile?.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold">
                          {application.candidateProfile?.fullName ?? 'Candidate'}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {application.candidateProfile?.headline ??
                            application.job?.title ??
                            'Applicant'}
                        </p>
                      </div>
                      {application.aiMatchScore !== null &&
                      application.aiMatchScore !== undefined ? (
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-primary dark:bg-blue-950">
                          {application.aiMatchScore}% match
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {application.analysis?.candidateSummary ??
                        application.candidateProfile?.summary ??
                        'No candidate summary is available.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {application.candidateProfile?.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                  <p className="text-xs text-muted-foreground">
                    Applied {formatDate(application.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setSelected(application)} size="sm" variant="outline">
                      <UserRound aria-hidden="true" className="h-4 w-4" />
                      View profile
                    </Button>
                    <Select
                      aria-label={`Update status for ${application.candidateProfile?.fullName ?? 'candidate'}`}
                      className="h-9 w-36 py-1 text-xs"
                      disabled={
                        updateStatus.isPending && updateStatus.variables?.id === application.id
                      }
                      onChange={(event) =>
                        updateStatus.mutate({
                          id: application.id,
                          nextStatus: event.target.value as ApplicationStatus,
                        })
                      }
                      value={application.status}
                    >
                      <option value={application.status}>
                        {friendlyLabel(application.status)}
                      </option>
                      {allowedTransitions[application.status]
                        .filter((item) => recruiterStatuses.includes(item))
                        .map((item) => (
                          <option key={item} value={item}>
                            {friendlyLabel(item)}
                          </option>
                        ))}
                    </Select>
                  </div>
                </div>
              </Card>
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
      {selected ? (
        <CandidateDetails application={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
