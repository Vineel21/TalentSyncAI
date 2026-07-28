import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
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
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader
          description="A clear view of your active roles, candidate pipeline, and the work that needs attention."
          eyebrow="Recruiter workspace"
          title="Hiring Overview"
          action={
            <Button asChild className="bg-blue-600 hover:bg-blue-500 shadow-md font-semibold">
              <Link className="flex items-center gap-2" to="/recruiter/jobs/new">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Create Job
              </Link>
            </Button>
          }
        />
      </motion.div>

      {/* Top Metric Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          helper="Published & draft roles"
          icon={BriefcaseBusiness}
          label="Total Jobs"
          value={data.stats.totalJobs}
        />
        <StatCard
          helper="Across all active roles"
          icon={UsersRound}
          label="Total Applicants"
          value={data.stats.totalApplicants}
        />
        <StatCard
          helper="Candidates in shortlist"
          icon={CircleCheckBig}
          label="Shortlisted"
          value={data.stats.shortlisted}
        />
        <StatCard
          helper="Active interview stages"
          icon={CalendarCheck2}
          label="Interviews"
          value={data.stats.interviews}
        />
      </div>

      {/* Chart & Pipeline Summary Grid */}
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
        <Card className="border bg-card p-5 text-card-foreground shadow-sm dark:border-slate-800 sm:p-6">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold">Applicant Activity</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Applicants and interview progression over time.
              </p>
            </div>
            <Link
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              to="/recruiter/analytics"
            >
              Full Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.analytics && data.analytics.length > 0 ? (
            <div
              aria-label="Applicant activity chart"
              className="overflow-x-auto pb-2"
              tabIndex={0}
            >
              <div className="h-72 min-w-[32rem] sm:min-w-0">
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
            </div>
          ) : (
            <EmptyState
              description="Activity trends will appear after candidates start applying."
              title="No analytics data yet"
            />
          )}
        </Card>

        {/* Pipeline Gradient Card */}
        <Card className="relative overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-5 text-white shadow-lg sm:p-6">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-blue-300 border border-white/15">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              Active Pipeline
            </span>
          </div>
          <h2 className="mt-5 text-xl font-bold">Pipeline At A Glance</h2>
          <div className="mt-6 space-y-3.5">
            {[
              ['Needs Review', data.stats.pending],
              ['Interviews Scheduled', data.stats.interviews],
              ['Offers Extended', data.stats.offers],
              ['Rejected', data.stats.rejected],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between border-b border-white/10 pb-2.5 text-sm"
                key={label}
              >
                <span className="text-slate-300 font-medium">{label}</span>
                <span className="text-lg font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
          <Button
            asChild
            className="mt-6 w-full border-white/20 bg-white/10 text-white hover:bg-white/20 font-semibold"
            variant="outline"
          >
            <Link to="/recruiter/applicants">Review Applicants</Link>
          </Button>
        </Card>
      </div>

      {/* Recent Jobs & Recent Applicants Split */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">Recent Jobs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest postings and applicant volume.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              to="/recruiter/jobs"
            >
              Manage All
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
            <Card className="divide-y border bg-card dark:border-slate-800 shadow-sm">
              {data.recentJobs.slice(0, 5).map((job) => (
                <div
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
                  key={job.id}
                >
                  <div className="min-w-0">
                    <Link
                      className="block truncate font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400"
                      to={`/recruiter/jobs/${job.id}/applicants`}
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <Badge
                    className="shrink-0"
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
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">Recent Applicants</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Candidates newly entering your pipeline.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              to="/recruiter/applicants"
            >
              View All
            </Link>
          </div>
          {data.recentApplicants.length === 0 ? (
            <EmptyState
              description="New applications will appear here when candidates apply."
              icon={FileClock}
              title="No applicants yet"
            />
          ) : (
            <Card className="divide-y border bg-card dark:border-slate-800 shadow-sm">
              {data.recentApplicants.slice(0, 5).map((application) => (
                <div
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
                  key={application.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {application.candidateProfile?.fullName ?? 'Candidate'}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {application.job?.title ?? 'Job application'} ·{' '}
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {application.aiMatchScore !== null && application.aiMatchScore !== undefined ? (
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
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
