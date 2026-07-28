import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { statusVariant } from '@/features/applications/application-card';
import { ResumeFeedbackPanel } from '@/features/applications/resume-feedback-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { isLiveAiProcessingEnabled } from '@/config/ai-processing';
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
  const liveAiProcessingEnabled = isLiveAiProcessingEnabled();

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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby="candidate-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
    >
      <button aria-label="Close candidate details" className="absolute inset-0" onClick={onClose} />
      <aside className="relative h-dvh w-full max-w-2xl overflow-y-auto overscroll-contain border-l bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-foreground shadow-2xl transition-colors dark:border-slate-800 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-md">
              {initials(candidate?.fullName)}
            </div>
            <div className="min-w-0">
              <h2
                className="break-words text-xl font-bold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-2xl"
                id="candidate-details-title"
              >
                {candidate?.fullName ?? 'Candidate profile'}
              </h2>
              <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
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
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin aria-hidden="true" className="h-4 w-4 text-blue-500" />
              {candidate.location}
            </span>
          ) : null}
        </div>

        {!liveAiProcessingEnabled ? (
          <div
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            Stored synthetic AI results remain visible for assessment. Generating or refreshing
            candidate analysis is paused while the deployment uses free Gemini.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-4 border bg-muted/30 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              AI Match Score
            </p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {matchScore !== null && matchScore !== undefined ? `${matchScore}%` : 'Not scored'}
            </p>
            {liveAiProcessingEnabled ? (
              <Button
                className="mt-3 w-full"
                isLoading={match.isPending}
                onClick={() => match.mutate()}
                size="sm"
                variant="outline"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4 text-blue-500" />
                {matchScore === null || matchScore === undefined
                  ? 'Generate Analysis'
                  : 'Refresh Score'}
              </Button>
            ) : (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {matchScore === null || matchScore === undefined
                  ? 'No stored match fixture is available.'
                  : 'Stored assessment fixture'}
              </p>
            )}
          </Card>

          <Card className="p-4 border bg-muted/30 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Current Pipeline Stage
              </p>
              <div className="mt-3">
                <Badge variant={statusVariant(application.status)}>
                  {friendlyLabel(application.status)}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied {formatDate(application.createdAt)}
            </p>
          </Card>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              {summary.data || application.analysis?.candidateSummary
                ? 'AI Candidate Summary'
                : 'Professional Summary'}
            </h3>
            {liveAiProcessingEnabled ? (
              <Button
                isLoading={summary.isPending}
                onClick={() => summary.mutate()}
                size="sm"
                variant="outline"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-500" />
                Generate AI Summary
              </Button>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-line break-words rounded-xl border bg-muted/50 p-4 text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere] dark:border-slate-800">
            {summary.data?.summary ??
              application.analysis?.candidateSummary ??
              candidate?.summary ??
              'No summary is available for this candidate.'}
          </p>
          {summary.data || application.analysis?.candidateSummary ? (
            <p className="mt-2 text-xs text-muted-foreground italic">
              AI-generated summaries assist screening and should be cross-referenced with the
              submitted resume.
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-bold">Skills Matrix</h3>
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

        <ResumeFeedbackPanel
          applicationId={application.id}
          initialFeedback={application.analysis?.resumeFeedback}
        />

        {match.data?.matchingSkills.length || application.analysis?.matchingSkills?.length ? (
          <section className="mt-8">
            <h3 className="text-lg font-bold">Match Signals</h3>
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
              <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {match.data.rationale}
              </p>
            ) : null}
          </section>
        ) : null}

        {application.coverLetter ? (
          <section className="mt-8">
            <h3 className="text-lg font-bold">Candidate Note</h3>
            <p className="mt-3 whitespace-pre-line break-words rounded-xl border bg-muted/60 p-4 text-sm leading-relaxed [overflow-wrap:anywhere] dark:border-slate-800">
              {application.coverLetter}
            </p>
          </section>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 pb-6 sm:flex-row sm:flex-wrap">
          <Button
            className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-500 sm:w-auto"
            isLoading={download.isPending}
            onClick={() => download.mutate()}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download Resume PDF
          </Button>
          {candidate?.linkedinUrl ? (
            <Button asChild className="w-full sm:w-auto" variant="outline">
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
            <Button asChild className="w-full sm:w-auto" variant="outline">
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

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader
          description={
            job.data
              ? `Review and move candidates through the ${job.data.title} pipeline.`
              : 'Review candidates across every role in your hiring pipeline.'
          }
          eyebrow="Candidate pipeline"
          title={job.data ? `${job.data.title} Applicants` : 'All Pipeline Applicants'}
        />
      </motion.div>

      <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center border bg-card dark:border-slate-800 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-bold text-foreground">{applications.data.pagination.total}</span>{' '}
          candidates
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
          <option value="">All Statuses</option>
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
          <div className="grid gap-5 xl:grid-cols-2">
            {applications.data.items.map((application) => (
              <Card
                className="border bg-card p-4 transition-all hover:shadow-md dark:border-slate-800 sm:p-6"
                key={application.id}
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
                    {initials(application.candidateProfile?.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-foreground [overflow-wrap:anywhere]">
                          {application.candidateProfile?.fullName ?? 'Candidate'}
                        </h2>
                        <p className="mt-0.5 break-words text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
                          {application.candidateProfile?.headline ??
                            application.job?.title ??
                            'Applicant'}
                        </p>
                      </div>
                      {application.aiMatchScore !== null &&
                      application.aiMatchScore !== undefined ? (
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {application.aiMatchScore}% Match
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
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

                <div className="mt-6 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center dark:border-slate-800">
                  <p className="text-xs text-muted-foreground">
                    Applied {formatDate(application.createdAt)}
                  </p>
                  <div className="grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => setSelected(application)}
                      size="sm"
                      variant="outline"
                    >
                      <UserRound aria-hidden="true" className="h-4 w-4 text-blue-500" />
                      View Profile
                    </Button>
                    <Select
                      aria-label={`Update status for ${application.candidateProfile?.fullName ?? 'candidate'}`}
                      className="h-9 w-full py-1 text-xs sm:w-40"
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
