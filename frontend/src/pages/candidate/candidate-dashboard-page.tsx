import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CircleCheckBig,
  FileText,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApplicationCard } from '@/features/applications/application-card';
import { JobCard } from '@/features/jobs/job-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/features/auth/auth-context';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { dashboardService } from '@/services/dashboard.service';
import { profileService } from '@/services/profile.service';

export function CandidateDashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const dashboard = useQuery({
    queryKey: ['dashboard', 'candidate'],
    queryFn: dashboardService.candidate,
  });
  const profile = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMine,
  });

  if (dashboard.isLoading || profile.isLoading)
    return <PageLoading label="Loading candidate dashboard" />;
  if (dashboard.isError || profile.isError) {
    return (
      <ErrorState
        message="Your dashboard data could not be loaded."
        onRetry={() => {
          void dashboard.refetch();
          void profile.refetch();
        }}
      />
    );
  }
  if (!dashboard.data || !profile.data) return <PageLoading label="Loading candidate dashboard" />;

  const data = dashboard.data;
  const candidate = profile.data;

  return (
    <div className="space-y-8">
      <PageHeader
        description="Here’s what’s moving in your search and where to focus next."
        eyebrow="Candidate workspace"
        title={`Good to see you${candidate.fullName || user?.fullName ? `, ${(candidate.fullName || user?.fullName)?.split(' ')[0]}` : ''}`}
        action={
          <Button asChild>
            <Link className="flex items-center gap-2" to="/jobs">
              Explore jobs <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Keep your profile current"
          icon={CircleCheckBig}
          label="Profile complete"
          value={`${candidate.profileCompletion}%`}
        />
        <StatCard
          helper="Across all active roles"
          icon={FileText}
          label="Applications"
          value={data.stats.totalApplications}
        />
        <StatCard
          helper="Conversations scheduled"
          icon={CalendarCheck2}
          label="Interviews"
          value={data.stats.interviews}
        />
        <StatCard
          helper="Offers received"
          icon={Sparkles}
          label="Offers"
          value={data.stats.offers}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div className="max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Profile momentum
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                A complete profile creates stronger matches.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Review your parsed experience and add any missing context before your next
                application.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Progress
                  className="max-w-xs flex-1 bg-white/15"
                  label="Profile completion"
                  value={candidate.profileCompletion}
                />
                <span className="text-sm font-bold">{candidate.profileCompletion}%</span>
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20"
              variant="outline"
            >
              <Link to="/profile">Complete profile</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-primary dark:bg-blue-950">
              <UploadCloud aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Resume status</h2>
              <p className="text-xs text-muted-foreground">
                {candidate.resumePath ? 'Uploaded and parsed' : 'No resume uploaded'}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {candidate.resumePath
              ? 'Refresh your resume whenever your experience changes.'
              : 'Upload a PDF to create your profile faster with AI.'}
          </p>
          <Button asChild className="mt-5 w-full" variant="outline">
            <Link to="/profile/upload-resume">
              {candidate.resumePath ? 'Update resume' : 'Upload resume'}
            </Link>
          </Button>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Recommended jobs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open roles aligned to your current profile.
            </p>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/jobs">
            View all
          </Link>
        </div>
        {data.recommendedJobs.length === 0 ? (
          <EmptyState
            action={
              <Button asChild>
                <Link to={candidate.resumePath ? '/jobs' : '/profile/upload-resume'}>
                  {candidate.resumePath ? 'Browse all jobs' : 'Upload resume'}
                </Link>
              </Button>
            }
            description={
              candidate.resumePath
                ? 'No recommendations are available yet. Browse all open roles in the meantime.'
                : 'Upload and parse your resume so we can surface roles aligned with your experience.'
            }
            icon={BriefcaseBusiness}
            title="No recommendations yet"
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.recommendedJobs.slice(0, 3).map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Recent applications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest movement in your search.
            </p>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/applications">
            Track all
          </Link>
        </div>
        {data.recentApplications.length === 0 ? (
          <EmptyState
            action={
              <Button asChild>
                <Link to="/jobs">Find a role</Link>
              </Button>
            }
            description="When you apply to a role, its latest status will appear here."
            title="No applications yet"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.recentApplications.slice(0, 4).map((application) => (
              <ApplicationCard application={application} key={application.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
