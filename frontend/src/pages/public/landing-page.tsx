import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileSearch,
  FileText,
  Gauge,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  UserCheck,
  UsersRound,
  Zap,
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

const heroStats = [
  { label: 'Demo Personas', value: '10', subtext: 'Candidates and recruiters' },
  { label: 'Pipeline Fixtures', value: '22', subtext: 'Every application status' },
  { label: 'Protected Tables', value: '8', subtext: 'Supabase RLS enabled' },
];

const features = [
  {
    icon: FileSearch,
    badge: 'Progressive Profile',
    title: 'Structured Candidate Profiles',
    description:
      'Complete guided manual onboarding and review every profile field. Synthetic fixtures demonstrate resume parsing while new uploads stay paused in the free-Gemini assessment deployment.',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Gauge,
    badge: 'Explainable Evidence',
    title: 'Explainable Fit Scoring',
    description:
      'Review stored synthetic match scores, matching skills, missing skills, and recommendations. AI output supports human review and never makes hiring decisions.',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: UsersRound,
    badge: 'Smart Shortlists',
    title: 'Focused Recruiter Pipeline',
    description:
      'Recruiters review structured profiles, stored assessment summaries, skill evidence, immutable resume snapshots, and controlled pipeline stages in one workspace.',
    gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

const steps = [
  {
    number: '01',
    icon: UploadCloud,
    title: 'Build a Candidate Profile',
    description:
      'Use guided manual entry in the public assessment. Eligible live environments can enable private backend resume parsing.',
  },
  {
    number: '02',
    icon: Bot,
    title: 'Review Structured Details',
    description:
      'Refine skills, experience, education, and certifications before completing onboarding.',
  },
  {
    number: '03',
    icon: Search,
    title: 'Explore Match Evidence',
    description:
      'Browse relevant roles and inspect deterministic recommendations or stored synthetic AI results.',
  },
];

const recruiterHighlights = [
  'Post & publish listings in minutes',
  'Stored synthetic summaries & match scores',
  'Role-based application pipeline tracking',
  'Private & secure resume PDF viewer',
];

const candidateHighlights = [
  'Guided manual profile onboarding',
  'Seeded match score breakdowns',
  'One-click application submission',
  'Transparent application status updates',
];

export function LandingPage() {
  useDocumentTitle('Recruitment platform');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'candidate' | 'recruiter'>('candidate');

  const jobs = useQuery({
    queryKey: ['jobs', 'landing', user?.role ?? 'anonymous'],
    queryFn: () => jobService.list({ page: 1, limit: 3, status: 'open' }),
    enabled: user?.role !== 'recruiter',
  });

  return (
    <main className="overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* HERO SECTION - White background in light mode, dark slate in dark mode */}
      <section className="relative min-h-[85vh] border-b bg-background text-foreground dark:bg-slate-950 dark:text-white transition-colors duration-300">
        {/* Animated Background Mesh & Floating Lights */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-pattern-light opacity-60 dark:bg-grid-pattern dark:opacity-30"
        />
        <motion.div
          aria-hidden="true"
          className="absolute left-1/4 top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px] dark:bg-blue-600/25"
          animate={{
            scale: [1, 1.15, 1],
            x: [-10, 20, -10],
            y: [-10, 15, -10],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute right-10 top-1/3 h-[450px] w-[450px] rounded-full bg-indigo-500/15 blur-[130px] dark:bg-indigo-600/20"
          animate={{
            scale: [1, 1.2, 1],
            x: [10, -25, 10],
            y: [10, -15, 10],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />

        <div className="container relative z-10 mx-auto grid items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-24 xl:py-32">
          {/* Hero Left Content */}
          <motion.div
            className="lg:col-span-7 xl:col-span-7"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md">
              <Sparkles
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400"
              />
              <span>Full-Stack Recruitment Platform</span>
              <span className="hidden sm:inline text-blue-400/50">•</span>
              <span className="hidden sm:inline opacity-80">Assessment-safe AI demo</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Intelligent matching for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
                modern talent &amp; hiring teams.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-slate-300 sm:text-lg lg:text-xl">
              Explore a seeded, assessment-safe recruitment workflow with structured profiles,
              explainable match evidence, application tracking, and recruiter analytics.
            </p>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                className="group relative overflow-hidden bg-blue-600 px-8 py-6 text-base font-semibold text-white shadow-xl shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/35"
                size="lg"
              >
                <Link className="flex items-center justify-center gap-2" to="/register">
                  <span>Explore Opportunities</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Button>

              <Button
                asChild
                className="border-slate-300 bg-background px-8 py-6 text-base font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:border-blue-400 hover:bg-muted dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                size="lg"
                variant="outline"
              >
                <Link
                  className="flex items-center justify-center gap-2"
                  to="/register?role=recruiter"
                >
                  <BriefcaseBusiness
                    aria-hidden="true"
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  />
                  <span>Start Hiring Smarter</span>
                </Link>
              </Button>
            </div>

            {/* Feature Checkmarks */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground dark:text-slate-400 sm:text-sm">
              {[
                { icon: ShieldCheck, text: 'Private Resume Fixtures' },
                { icon: Zap, text: 'Explainable Match Evidence' },
                { icon: UserCheck, text: 'Role-Based Dashboards' },
              ].map(({ icon: Icon, text }) => (
                <div
                  className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 dark:bg-slate-900/40 dark:border-slate-800/60"
                  key={text}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Right Floating Visual Mockup */}
          <motion.div
            className="lg:col-span-5 xl:col-span-5"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
            >
              {/* Outer Glowing Gradient Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-25 blur-xl transition duration-1000 dark:opacity-40" />

              {/* AI Visual Card */}
              <div className="relative rounded-2xl border bg-card p-5 shadow-2xl backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/90 sm:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 dark:border-white/10">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Seeded Match Fixture
                      </p>
                      <p className="break-words text-sm font-bold text-foreground dark:text-white">
                        Data Analyst Role
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/30 dark:text-emerald-400 shadow-sm">
                    Synthetic 92% Match
                  </div>
                </div>

                {/* Body Content */}
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-muted/60 p-4 border dark:bg-slate-950/70 dark:border-white/10 shadow-inner">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground dark:text-slate-400">
                      <span>Matching Skill Stack</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        5 / 5 Core Matched
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['SQL', 'Python', 'Power BI', 'Excel', 'Statistics'].map((skill) => (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/30"
                          key={skill}
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-4 border dark:bg-slate-950/70 dark:border-white/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Stored Gemini Fixture</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
                      &quot;Strong alignment in SQL, Python, and Power BI. Three years of analytics
                      experience supports the role requirements.&quot;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl bg-muted/40 p-3 border dark:bg-slate-950/50 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
                        <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Resume Status</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-foreground dark:text-slate-200">
                        Seeded PDF Fixture
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3 border dark:bg-slate-950/50 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
                        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Security</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-foreground dark:text-slate-200">
                        Supabase RLS Protected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS BANNER - Clean light background in light mode, sleek dark in dark mode */}
      <section className="border-b bg-card text-foreground py-10 transition-colors dark:bg-slate-900 dark:text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {heroStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex items-center justify-between rounded-xl border bg-muted/30 p-6 shadow-sm dark:bg-white/5 dark:border-white/10 backdrop-blur-md"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary dark:text-blue-400">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                    {stat.subtext}
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-primary dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES MATRIX */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:py-28" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for precision, speed, and clarity
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Use clear profiles, match evidence, and controlled pipeline stages instead of opaque
            screening.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
            >
              <Card className="group relative h-full overflow-hidden border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-card sm:p-8">
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-xl ${feature.iconBg}`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS PROCESS SECTION - Clean light mode background, subtle card containers */}
      <section
        className="border-y bg-muted/40 py-20 dark:bg-slate-900/60 lg:py-28"
        id="how-it-works"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Simple 3-Step Journey
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From profile setup to matched opportunity
            </h2>
            <p className="mt-3 text-muted-foreground">
              A transparent, privacy-first workflow designed to save time for candidates &amp;
              recruiters.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className="relative rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-blue-500/20 dark:text-blue-400/20">
                    {step.number}
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLE TOGGLE WORKFLOW COMPARISON */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tailored experience for every role
          </h2>
          <p className="mt-3 text-muted-foreground">
            Switch tabs below to inspect the implemented candidate and recruiter workflows.
          </p>

          {/* Interactive Role Switcher */}
          <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 rounded-xl border bg-muted p-1 sm:w-auto sm:max-w-none">
            <button
              onClick={() => setActiveTab('candidate')}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all sm:px-6 sm:text-sm ${
                activeTab === 'candidate'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-4 w-4 text-blue-500" />
              For Job Candidates
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all sm:px-6 sm:text-sm ${
                activeTab === 'recruiter'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4 text-indigo-500" />
              For Hiring Recruiters
            </button>
          </div>
        </div>

        <div className="mt-12 mx-auto max-w-4xl">
          <AnimatePresence mode="wait">
            {activeTab === 'candidate' ? (
              <motion.div
                key="candidate-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid items-center gap-8 rounded-2xl border bg-card p-5 shadow-lg dark:border-slate-800 sm:p-8 md:grid-cols-2 lg:p-10"
              >
                <div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    Candidate Portal
                  </span>
                  <h3 className="mt-4 text-2xl font-bold">Apply with clarity &amp; confidence</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Build a reusable profile with guided manual onboarding. Seeded candidates
                    demonstrate parsed resume data and match evidence without sending new personal
                    data to free Gemini.
                  </p>
                  <div className="mt-6 space-y-3">
                    {candidateHighlights.map((item) => (
                      <div className="flex items-center gap-3 text-sm font-medium" key={item}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="mt-8 h-auto min-h-12 w-full whitespace-normal px-4 text-sm shadow-md sm:w-auto sm:text-base"
                    size="lg"
                  >
                    <Link
                      className="flex items-center justify-center gap-2 text-center"
                      to="/register"
                    >
                      Create Candidate Account <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="rounded-xl bg-slate-900 p-6 text-white shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-slate-400">
                      Seeded Resume Profile
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      Synthetic fixture
                    </span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="rounded bg-slate-800/80 p-3">
                      <p className="font-semibold text-blue-300">Extracted Skills</p>
                      <p className="mt-1 text-slate-400">
                        React, TypeScript, JavaScript, Tailwind CSS, Git
                      </p>
                    </div>
                    <div className="rounded bg-slate-800/80 p-3">
                      <p className="font-semibold text-indigo-300">Match Assessment</p>
                      <p className="mt-1 text-slate-400">
                        Stored 91% match for the Junior Frontend Engineer fixture.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="recruiter-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid items-center gap-8 rounded-2xl border bg-card p-5 shadow-lg dark:border-slate-800 sm:p-8 md:grid-cols-2 lg:p-10"
              >
                <div>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Recruiter Workspace
                  </span>
                  <h3 className="mt-4 text-2xl font-bold">Shortlist top talent effortlessly</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Publish jobs, review structured candidate evidence and stored synthetic AI
                    summaries, then move applicants through a controlled hiring pipeline.
                  </p>
                  <div className="mt-6 space-y-3">
                    {recruiterHighlights.map((item) => (
                      <div className="flex items-center gap-3 text-sm font-medium" key={item}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="mt-8 h-auto min-h-12 w-full whitespace-normal px-4 text-sm shadow-md sm:w-auto sm:text-base"
                    size="lg"
                    variant="default"
                  >
                    <Link
                      className="flex items-center justify-center gap-2 text-center"
                      to="/register?role=recruiter"
                    >
                      Register Recruiter Workspace <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="rounded-xl bg-slate-900 p-6 text-white shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-slate-400">
                      Recruiter Applicant View
                    </span>
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                      Seeded applicants
                    </span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded bg-slate-800/80 p-3">
                      <div>
                        <p className="font-semibold text-slate-200">Rohan Gupta</p>
                        <p className="text-slate-400">Data Analyst</p>
                      </div>
                      <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400">
                        92% Match
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-slate-800/80 p-3">
                      <div>
                        <p className="font-semibold text-slate-200">Kavya Reddy</p>
                        <p className="text-slate-400">Product Analyst</p>
                      </div>
                      <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-300">
                        88% Match
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* RECENT JOBS SECTION */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:py-24" id="jobs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              Open Opportunities
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Openings
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link
              className="flex items-center gap-2"
              to={user?.role === 'recruiter' ? '/recruiter/jobs' : '/jobs'}
            >
              {user?.role === 'recruiter' ? 'Manage your jobs' : 'Browse all jobs'}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10">
          {user?.role === 'recruiter' ? (
            <Card className="border-dashed p-10 text-center shadow-sm">
              <BriefcaseBusiness aria-hidden="true" className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-4 font-semibold text-lg">Your recruiter workspace is active.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Public job search is tailored for candidates. Head over to your workspace to publish
                roles and evaluate applicants.
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild>
                  <Link to="/recruiter/jobs">Manage Workspace Jobs</Link>
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
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              role="status"
            >
              {[0, 1, 2].map((item) => (
                <Skeleton className="h-80 rounded-2xl" key={item} />
              ))}
            </div>
          ) : jobs.data.items.length === 0 ? (
            <Card className="border-dashed p-12 text-center shadow-sm">
              <p className="font-semibold text-lg">New opportunities on the way.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign up today to be notified as soon as new matching positions open up.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.data.items.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="container mx-auto px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-full bg-grid-pattern opacity-10"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to explore the TalentSync assessment?
            </h2>
            <p className="mt-4 text-base text-blue-100 sm:text-lg">
              Use a demo account to inspect seeded AI evidence, or create an account to try the
              complete manual candidate and recruiter workflows.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                className="bg-white text-blue-700 shadow-lg hover:bg-blue-50 font-semibold"
                size="lg"
              >
                <Link to="/register">Create Free Account</Link>
              </Button>
              <Button
                asChild
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold"
                size="lg"
                variant="outline"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
