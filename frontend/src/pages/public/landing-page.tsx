import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  Gauge,
  Search,
  Sparkles,
  UploadCloud,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobCard } from '@/features/jobs/job-card';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/state-view';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { jobService } from '@/services/job.service';

const features = [
  {
    icon: FileSearch,
    title: 'Resume intelligence',
    description:
      'Upload once. AI structures your experience, skills, and education into a profile you control.',
  },
  {
    icon: Gauge,
    title: 'Explainable matching',
    description:
      'Understand your fit with clear matching skills, gaps, and recommendations—not a mystery score.',
  },
  {
    icon: UsersRound,
    title: 'Focused shortlists',
    description:
      'Recruiters review qualified applicants faster with concise summaries and consistent match signals.',
  },
];

const steps = [
  {
    icon: UploadCloud,
    title: 'Bring your resume',
    description: 'Securely upload your PDF resume.',
  },
  {
    icon: Bot,
    title: 'Let AI do the busywork',
    description: 'Review and refine your parsed profile.',
  },
  {
    icon: Search,
    title: 'Meet the right roles',
    description: 'Discover jobs and apply with context.',
  },
];

export function LandingPage() {
  useDocumentTitle('AI-powered hiring');
  const { user } = useAuth();
  const jobs = useQuery({
    queryKey: ['jobs', 'landing', user?.role ?? 'anonymous'],
    queryFn: () => jobService.list({ page: 1, limit: 3, status: 'open' }),
    enabled: user?.role !== 'recruiter',
  });

  return (
    <main>
      <section className="relative overflow-hidden border-b bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl"
        />
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Intelligent hiring, built for people
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your next great match, without the hiring noise.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              TalentSync AI turns resumes into rich profiles, makes job fit understandable, and
              helps hiring teams focus on the people who belong in the conversation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="shadow-lg shadow-blue-700/25" size="lg">
                <Link className="flex items-center gap-2" to="/register">
                  Find your next role <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                size="lg"
                variant="outline"
              >
                <Link to="/register?role=recruiter">Start hiring smarter</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {['Private resume storage', 'No duplicate data entry', 'Human-led decisions'].map(
                (item) => (
                  <span className="inline-flex items-center gap-2" key={item}>
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-400" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <Card className="border-white/10 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Explainable matching
                  </p>
                  <p className="mt-1 text-xl font-bold">See the signal behind each role</p>
                </div>
                <span className="grid h-16 w-16 place-items-center rounded-full border border-blue-300/30 bg-blue-400/10 text-blue-200">
                  <Sparkles aria-hidden="true" className="h-7 w-7" />
                </span>
              </div>
              <div className="mt-8 space-y-4">
                <div className="rounded-xl bg-slate-950/40 p-4">
                  <p className="text-xs text-slate-400">Understand each recommendation</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Aligned experience', 'Matching skills', 'Growth areas'].map((signal) => (
                      <span
                        className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200"
                        key={signal}
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-950/40 p-4">
                    <p className="font-bold">Profile first</p>
                    <p className="mt-1 text-xs text-slate-400">Grounded in your data</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/40 p-4">
                    <p className="font-bold">Human reviewed</p>
                    <p className="mt-1 text-xs text-slate-400">AI supports decisions</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="container py-20" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            A better hiring loop
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Less admin. More signal.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Purpose-built tools for candidates and recruiters to make informed decisions, faster.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card className="p-6" key={feature.title}>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950">
                <feature.icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-white py-20 dark:bg-card" id="how-it-works">
        <div className="container">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              From resume to relevant in three steps.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div className="relative" key={step.title}>
                <p className="text-6xl font-extrabold text-slate-100 dark:text-slate-800">
                  0{index + 1}
                </p>
                <div className="-mt-6 ml-4">
                  <step.icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20" id="jobs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Fresh opportunities
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Roles worth exploring</h2>
          </div>
          <Button asChild variant="outline">
            <Link
              className="flex items-center gap-2"
              to={user?.role === 'recruiter' ? '/recruiter/jobs' : '/jobs'}
            >
              {user?.role === 'recruiter' ? 'Manage your jobs' : 'Browse all jobs'}{' '}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10">
          {user?.role === 'recruiter' ? (
            <Card className="border-dashed p-10 text-center">
              <BriefcaseBusiness aria-hidden="true" className="mx-auto h-7 w-7 text-primary" />
              <p className="mt-4 font-semibold">Your recruiter workspace is ready.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Open job discovery is designed for candidates. Continue to your workspace to manage
                roles and applicants.
              </p>
              <div className="mt-5 flex justify-center">
                <Button asChild>
                  <Link to="/recruiter/jobs">Manage jobs</Link>
                </Button>
              </div>
            </Card>
          ) : jobs.isError ? (
            <ErrorState
              message="The latest jobs aren’t available right now."
              onRetry={() => void jobs.refetch()}
            />
          ) : jobs.isLoading || !jobs.data ? (
            <div
              aria-label="Loading latest jobs"
              className="grid gap-5 md:grid-cols-3"
              role="status"
            >
              {[0, 1, 2].map((item) => (
                <Skeleton className="h-80" key={item} />
              ))}
            </div>
          ) : jobs.data.items.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <p className="font-semibold">New roles are on the way.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an account and check back soon.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {jobs.data.items.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container pb-20">
        <div className="overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-white shadow-xl shadow-blue-200 dark:shadow-none sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Ready for a smarter next step?</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Build a reusable profile or create your first job. TalentSync keeps the process focused
            from day one.
          </p>
          <Button asChild className="mt-7 bg-white text-blue-700 hover:bg-blue-50" size="lg">
            <Link to="/register">Create your free account</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
