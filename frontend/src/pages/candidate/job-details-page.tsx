import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { ErrorState, PageLoading } from '@/components/ui/state-view';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage, formatCurrency, formatDate, friendlyLabel } from '@/lib/utils';
import { aiService } from '@/services/ai.service';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';

const applySchema = z.object({
  coverLetter: z
    .string()
    .max(10_000, 'Keep your note under 10,000 characters.')
    .refine(
      (value) => value.trim().length === 0 || value.trim().length >= 20,
      'Write at least 20 characters, or leave the note blank.',
    ),
});
type ApplyValues = z.infer<typeof applySchema>;

export function JobDetailsPage() {
  const { id = '' } = useParams();
  const [applyOpen, setApplyOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const job = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobService.get(id),
    enabled: Boolean(id),
  });
  useDocumentTitle(job.data?.title ?? 'Job details');
  const form = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { coverLetter: '' },
  });
  const match = useMutation({
    mutationFn: () => aiService.candidateMatchScore(id),
    onError: (error) => toast.error('Match analysis unavailable', errorMessage(error)),
  });
  const apply = useMutation({
    mutationFn: (values: ApplyValues) =>
      applicationService.create({ jobId: id, coverLetter: values.coverLetter || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application sent', 'You can track every update in Applications.');
      navigate('/applications');
    },
    onError: (error) => toast.error('Application not sent', errorMessage(error)),
  });

  if (job.isLoading) return <PageLoading label="Loading job details" />;
  if (job.isError)
    return <ErrorState message={errorMessage(job.error)} onRetry={() => void job.refetch()} />;
  if (!job.data) return <PageLoading label="Loading job details" />;
  const data = job.data;
  const salaryMin = formatCurrency(data.salaryMin);
  const salaryMax = formatCurrency(data.salaryMax);

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        to="/jobs"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to jobs
      </Link>
      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <BriefcaseBusiness aria-hidden="true" className="h-6 w-6 text-blue-300" />
              </div>
              <p className="text-sm font-semibold text-blue-300">{data.companyName}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{data.title}</h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {data.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Posted {formatDate(data.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <WalletCards aria-hidden="true" className="h-4 w-4" />
                  {salaryMin && salaryMax
                    ? `${salaryMin} – ${salaryMax}`
                    : (salaryMin ?? salaryMax ?? 'Salary not disclosed')}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Button
                className="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => setApplyOpen(true)}
                size="lg"
              >
                Apply now
              </Button>
              <Button
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                isLoading={match.isPending}
                onClick={() => match.mutate()}
                variant="outline"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Check my match
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold">About the role</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {data.description}
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold">What you’ll bring</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {data.requirements}
              </p>
            </section>
          </div>
          <aside className="space-y-5">
            <Card className="p-5">
              <p className="text-sm font-semibold">Role details</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Employment</span>
                  <span className="font-medium">{friendlyLabel(data.employmentType)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="success">{friendlyLabel(data.status)}</Badge>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Apply by</span>
                  <span className="font-medium">{formatDate(data.expiresAt)}</span>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold">Required skills</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
            {match.data ? (
              <Card className="border-blue-200 p-5 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <p className="font-bold">Your AI match</p>
                  <span className="text-2xl font-bold text-primary">{match.data.score}%</span>
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {friendlyLabel(match.data.recommendation)}
                </p>
                {match.data.rationale ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {match.data.rationale}
                  </p>
                ) : null}
                {match.data.matchingSkills.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Matching skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.data.matchingSkills.map((skill) => (
                        <Badge key={skill} variant="success">
                          <CheckCircle2 aria-hidden="true" className="mr-1 h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {match.data.missingSkills.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skills to grow
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.data.missingSkills.map((skill) => (
                        <Badge key={skill} variant="warning">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  This score is decision support, not a guarantee of fit or selection.
                </p>
              </Card>
            ) : null}
          </aside>
        </div>
      </Card>

      {applyOpen ? (
        <div
          aria-labelledby="apply-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <Card className="w-full max-w-xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold" id="apply-title">
                  Apply to {data.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{data.companyName}</p>
              </div>
              <Button
                aria-label="Close application form"
                onClick={() => setApplyOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>
            <form
              className="space-y-5 p-5"
              noValidate
              onSubmit={form.handleSubmit((values) => apply.mutate(values))}
            >
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                Your current TalentSync profile and resume will be included.
              </div>
              <FormField
                id="coverLetter"
                label="Note to the hiring team (optional)"
                error={form.formState.errors.coverLetter?.message}
                hint="Share context that isn’t obvious from your resume."
              >
                <Textarea
                  autoFocus
                  id="coverLetter"
                  placeholder="I’m interested in this role because…"
                  rows={8}
                  {...form.register('coverLetter')}
                />
              </FormField>
              <div className="flex justify-end gap-3">
                <Button onClick={() => setApplyOpen(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button isLoading={apply.isPending} type="submit">
                  Submit application
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
