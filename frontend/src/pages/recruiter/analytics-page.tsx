import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, BriefcaseBusiness, CalendarCheck2, Target, UsersRound } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { dashboardService } from '@/services/dashboard.service';

const pieColors = ['#2563eb', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

export function AnalyticsPage() {
  useDocumentTitle('Hiring analytics');
  const dashboard = useQuery({
    queryKey: ['dashboard', 'recruiter'],
    queryFn: dashboardService.recruiter,
  });

  if (dashboard.isLoading) return <PageLoading label="Loading hiring analytics" />;
  if (dashboard.isError)
    return (
      <ErrorState
        message="Hiring analytics could not be loaded."
        onRetry={() => void dashboard.refetch()}
      />
    );
  if (!dashboard.data) return <PageLoading label="Loading hiring analytics" />;
  const { stats, analytics } = dashboard.data;

  const interviewRate = stats.totalApplicants
    ? Math.round((stats.interviews / stats.totalApplicants) * 100)
    : 0;
  const offerRate = stats.totalApplicants
    ? Math.round((stats.offers / stats.totalApplicants) * 100)
    : 0;

  const pipeline = [
    { label: 'Pending', value: stats.pending },
    { label: 'Shortlisted', value: stats.shortlisted },
    { label: 'Interview', value: stats.interviews },
    { label: 'Offer', value: stats.offers },
    { label: 'Rejected', value: stats.rejected },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader
          description="Understand pipeline health and where candidates move through your hiring process."
          eyebrow="Hiring intelligence"
          title="Recruiting Analytics"
        />
      </motion.div>

      {/* Top Stat Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          helper="Across all workspace roles"
          icon={UsersRound}
          label="Total Applicants"
          value={stats.totalApplicants}
        />
        <StatCard
          helper="Roles created by team"
          icon={BriefcaseBusiness}
          label="Jobs Created"
          value={stats.totalJobs}
        />
        <StatCard
          helper="Applicants reaching interview"
          icon={CalendarCheck2}
          label="Interview Conversion"
          value={`${interviewRate}%`}
        />
        <StatCard
          helper="Applicants receiving offers"
          icon={Target}
          label="Offer Conversion"
          value={`${offerRate}%`}
        />
      </div>

      {!analytics?.length && !pipeline.length ? (
        <EmptyState
          description="Charts will populate once your open jobs receive applications and candidates move through the pipeline."
          icon={BarChart3}
          title="No hiring data yet"
        />
      ) : (
        <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <Card className="border bg-card p-5 shadow-sm dark:border-slate-800 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Applications Over Time</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare applicant volume with interviews scheduled.
              </p>
            </div>
            {analytics?.length ? (
              <div
                aria-label="Application and interview volume chart"
                className="mt-6 overflow-x-auto pb-2"
                tabIndex={0}
              >
                <div className="h-80 min-w-[34rem] sm:min-w-0">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={analytics}>
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
                      <Legend />
                      <Bar
                        dataKey="applicants"
                        fill="#2563eb"
                        name="Applicants"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="interviews"
                        fill="#10b981"
                        name="Interviews"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                No time-series data is available yet.
              </p>
            )}
          </Card>

          <Card className="border bg-card p-5 shadow-sm dark:border-slate-800 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pipeline Distribution</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current candidate breakdown across stages.
              </p>
            </div>
            {pipeline.length ? (
              <div aria-label="Candidate pipeline distribution chart" className="mt-6 h-80">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="45%"
                      data={pipeline}
                      dataKey="value"
                      innerRadius="38%"
                      nameKey="label"
                      outerRadius="68%"
                      paddingAngle={3}
                    >
                      {pipeline.map((entry, index) => (
                        <Cell fill={pieColors[index % pieColors.length]} key={entry.label} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                No pipeline data is available yet.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Responsible AI Guidance Card */}
      <Card className="border bg-muted/40 p-5 dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">Responsible Intelligence Guidelines</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Analytics and AI match scores surface key signals in your hiring funnel. Use them to
          assist decision-making while ensuring human recruiters maintain final accountability for
          candidate selection.
        </p>
      </Card>
    </div>
  );
}
