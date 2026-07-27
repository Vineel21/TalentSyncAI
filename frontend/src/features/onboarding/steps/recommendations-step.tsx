import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/state-view';
import { SaveJobButton, useSavedJobs } from '@/features/saved-jobs/saved-jobs';
import { errorMessage } from '@/lib/utils';
import { onboardingService } from '@/services/onboarding.service';
import type { JobRecommendation } from '@/types/api';

export const onboardingRecommendationsQueryKey = ['onboarding', 'recommendations'] as const;

function RecommendationCard({
  recommendation,
  savedJobs,
}: {
  recommendation: JobRecommendation;
  savedJobs: ReturnType<typeof useSavedJobs>['data'];
}) {
  const { job, match, aiGenerated } = recommendation;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950">
          <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge variant={match.score >= 75 ? 'success' : 'warning'}>{match.score}% match</Badge>
          <Badge variant={aiGenerated ? 'secondary' : 'outline'}>
            {aiGenerated ? 'AI recommendation' : 'Profile match'}
          </Badge>
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-bold">{job.title}</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{job.companyName}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          {job.location}
        </p>
      </div>
      {match.matchingSkills.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Your matching skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.matchingSkills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="success">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
        {match.rationale ?? match.recommendation}
      </p>
      {showDetails ? (
        <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-4 text-sm">
          <div>
            <p className="font-bold">About the role</p>
            <p className="mt-1 whitespace-pre-line leading-6 text-muted-foreground">
              {job.description}
            </p>
          </div>
          <div>
            <p className="font-bold">Requirements</p>
            <p className="mt-1 whitespace-pre-line leading-6 text-muted-foreground">
              {job.requirements}
            </p>
          </div>
          {match.missingSkills.length > 0 ? (
            <div>
              <p className="font-bold">Skills to develop</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {match.missingSkills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          aria-expanded={showDetails}
          className="flex-1"
          onClick={() => setShowDetails((current) => !current)}
          type="button"
          variant="outline"
        >
          {showDetails ? 'Hide details' : 'View details'}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Button>
        <SaveJobButton className="sm:min-w-24" job={job} savedJobs={savedJobs} />
      </div>
    </Card>
  );
}

export function RecommendationsStep({
  isCompleting,
  onBack,
  onComplete,
}: {
  isCompleting: boolean;
  onBack: () => void;
  onComplete: (skipped: boolean) => void;
}) {
  const recommendations = useQuery({
    queryKey: onboardingRecommendationsQueryKey,
    queryFn: onboardingService.recommendations,
    retry: false,
  });
  const savedJobs = useSavedJobs();

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Step 3</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Roles selected for your profile
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Review your strongest early matches. You can save interesting roles now or skip and
          explore later from your dashboard.
        </p>
      </div>

      {savedJobs.isError ? (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            Saved-job controls are temporarily unavailable. Your recommendations are still here.
          </p>
          <Button onClick={() => void savedJobs.refetch()} size="sm" variant="outline">
            Retry saved jobs
          </Button>
        </div>
      ) : null}

      {recommendations.isLoading ? (
        <div
          aria-label="Finding job matches"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <Skeleton className="h-96" key={item} />
          ))}
          <span className="sr-only">Finding job matches</span>
        </div>
      ) : null}

      {recommendations.isError ? (
        <Card className="border-amber-200 p-6 text-center dark:border-amber-900">
          <Sparkles aria-hidden="true" className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="mt-4 text-lg font-bold">Matches aren’t available right now</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {errorMessage(recommendations.error)} You can retry or finish setup without
            recommendations.
          </p>
          <Button className="mt-4" onClick={() => void recommendations.refetch()} variant="outline">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </Button>
        </Card>
      ) : null}

      {recommendations.data?.length === 0 ? (
        <EmptyState
          description="There are no open roles aligned to your profile yet. Finish setup and check back as new jobs arrive."
          icon={BriefcaseBusiness}
          title="No matches yet"
        />
      ) : null}

      {recommendations.data && recommendations.data.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.data.map((recommendation) => (
            <RecommendationCard
              key={recommendation.job.id}
              recommendation={recommendation}
              savedJobs={savedJobs.data}
            />
          ))}
        </div>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-3 border bg-card/95 p-3 shadow-lg backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:rounded-xl lg:bottom-4">
        <Button disabled={isCompleting} onClick={onBack} type="button" variant="ghost">
          Back
        </Button>
        <div className="flex flex-1 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            disabled={isCompleting}
            onClick={() => onComplete(true)}
            type="button"
            variant="ghost"
          >
            Skip for now
          </Button>
          <Button isLoading={isCompleting} onClick={() => onComplete(false)} type="button">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Finish and go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
