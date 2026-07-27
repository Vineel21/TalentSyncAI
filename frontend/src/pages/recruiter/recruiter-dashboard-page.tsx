import { useQuery } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarCheck2,
  CircleCheckBig,
  FileClock,
  Plus,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statusVariant } from '@/features/applications/application-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { StatCard } from '@/components/ui/stat-card';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { dashboardService } from '@/services/dashboard.service';
import { formatDate, friendlyLabel } from '@/lib/utils';

export function RecruiterDashboardPage() {
  useDocumentTitle('Recruiter dashboard');
  const dashboard = useQuery({
    queryKey: ['dashboard', 'recruiter'],
    queryFn: dashboardService.recruiter,
  });

  if (dashboard.isLoading) return <PageLoading label="Loading recruiter dashboard" />;
  if (dashboard.isError)
    return (
      <ErrorState
        message="Your hiring dashboard could not be loaded."
        onRetry={() => void dashboard.refetch()}
      />
    );
  if (!dashboard.data) return <PageLoading label="Loading recruiter dashboard" />;
  const data = dashboard.data;

  return (
    <div className="space-y-8">
      <PageHeader
        description="A clear view of your active roles, candidate pipeline, and the work that needs attention."
        eyebrow="Recruiter workspace"
        title="Hiring overview"
        action={
          <Button asChild>
            <Link className="flex items-center gap-2" to="/recruiter/jobs/new">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Create job
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Published and draft roles"
          icon={BriefcaseBusiness}
          label="Total jobs"
          value={data.stats.totalJobs}
        />
        <StatCard
          helper="Across all job postings"
          icon={UsersRound}
          label="Applicants"
          value={data.stats.totalApplicants}
        />
        <StatCard
          helper="Candidates in consideration"
          icon={CircleCheckBig}
          label="Shortlisted"
          value={data.stats.shortlisted}
        />
        <StatCard
          helper="Active conversations"
          icon={CalendarCheck2}
          label="Interviews"
          value={data.stats.interviews}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.5fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Applicant activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Applicants and interviews over time.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:underline"
              to="/recruiter/analytics"
            >
              Full analytics
            </Link>
          </div>
          {data.analytics && data.analytics.length > 0 ? (
            <div className="h-72" aria-label="Applicant activity chart">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={data.analytics}>
                  <defs>
                    <linearGradient id="applicantArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" fontSize={12} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    fontSize={12}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip />
                  <Area
                    dataKey="applicants"
                    fill="url(#applicantArea)"
                    stroke="#2563eb"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area
                    dataKey="interviews"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              description="Activity trends will appear after candidates start applying."
              title="No analytics data yet"
            />
          )}
        </Card>
        <Card className="bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-blue-300">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Pipeline at a glance</h2>
          <div className="mt-6 space-y-4">
            {[
              ['Needs review', data.stats.pending],
              ['Interviews', data.stats.interviews],
              ['Offers', data.stats.offers],
              ['Rejected', data.stats.rejected],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between border-b border-white/10 pb-3 text-sm"
                key={label}
              >
                <span className="text-slate-300">{label}</span>
                <span className="text-lg font-bold">{value}</span>
              </div>
            ))}
          </div>
          <Button
            asChild
            className="mt-6 w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            variant="outline"
          >
            <Link to="/recruiter/applicants">Review applicants</Link>
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent jobs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest postings and applicant volume.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:underline"
              to="/recruiter/jobs"
            >
              Manage all
            </Link>
          </div>
          {data.recentJobs.length === 0 ? (
            <EmptyState
              action={
                <Button asChild>
                  <Link to="/recruiter/jobs/new">Create your first job</Link>
                </Button>
              }
              description="Publish a role to begin building your candidate pipeline."
              icon={BriefcaseBusiness}
              title="No jobs yet"
            />
          ) : (
            <Card className="divide-y">
              {data.recentJobs.slice(0, 5).map((job) => (
                <div className="flex items-center justify-between gap-4 p-4" key={job.id}>
                  <div className="min-w-0">
                    <Link
                      className="truncate font-semibold hover:text-primary"
                      to={`/recruiter/jobs/${job.id}/applicants`}
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      job.status === 'open'
                        ? 'success'
                        : job.status === 'draft'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {friendlyLabel(job.status)}
                  </Badge>
                </div>
              ))}
            </Card>
          )}
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent applicants</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Candidates newly entering your pipeline.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:underline"
              to="/recruiter/applicants"
            >
              View all
            </Link>
          </div>
          {data.recentApplicants.length === 0 ? (
            <EmptyState
              description="New applications will appear here when candidates apply."
              icon={FileClock}
              title="No applicants yet"
            />
          ) : (
            <Card className="divide-y">
              {data.recentApplicants.slice(0, 5).map((application) => (
                <div className="flex items-center justify-between gap-4 p-4" key={application.id}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {application.candidateProfile?.fullName ?? 'Candidate'}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {application.job?.title ?? 'Job application'} ·{' '}
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {application.aiMatchScore !== null && application.aiMatchScore !== undefined ? (
                      <span className="text-sm font-bold text-primary">
                        {application.aiMatchScore}%
                      </span>
                    ) : null}
                    <Badge variant={statusVariant(application.status)}>
                      {friendlyLabel(application.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
