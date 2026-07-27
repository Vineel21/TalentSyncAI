import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { CandidateOnboardingGate } from '@/features/onboarding/candidate-onboarding-gate';
import { AppShell } from '@/layouts/app-shell';
import { PublicLayout } from '@/layouts/public-layout';
import { ProtectedRoute } from './protected-route';

const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/register-page').then((module) => ({ default: module.RegisterPage })),
);
const ApplicationsPage = lazy(() =>
  import('@/pages/candidate/applications-page').then((module) => ({
    default: module.ApplicationsPage,
  })),
);
const CandidateDashboardPage = lazy(() =>
  import('@/pages/candidate/candidate-dashboard-page').then((module) => ({
    default: module.CandidateDashboardPage,
  })),
);
const JobDetailsPage = lazy(() =>
  import('@/pages/candidate/job-details-page').then((module) => ({
    default: module.JobDetailsPage,
  })),
);
const JobsPage = lazy(() =>
  import('@/pages/candidate/jobs-page').then((module) => ({ default: module.JobsPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/candidate/profile-page').then((module) => ({ default: module.ProfilePage })),
);
const ResumeUploadPage = lazy(() =>
  import('@/pages/candidate/resume-upload-page').then((module) => ({
    default: module.ResumeUploadPage,
  })),
);
const OnboardingPage = lazy(() =>
  import('@/pages/candidate/onboarding-page').then((module) => ({
    default: module.OnboardingPage,
  })),
);
const LandingPage = lazy(() =>
  import('@/pages/public/landing-page').then((module) => ({ default: module.LandingPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/pages/recruiter/analytics-page').then((module) => ({
    default: module.AnalyticsPage,
  })),
);
const ApplicantsPage = lazy(() =>
  import('@/pages/recruiter/applicants-page').then((module) => ({
    default: module.ApplicantsPage,
  })),
);
const JobEditorPage = lazy(() =>
  import('@/pages/recruiter/job-editor-page').then((module) => ({
    default: module.JobEditorPage,
  })),
);
const RecruiterDashboardPage = lazy(() =>
  import('@/pages/recruiter/recruiter-dashboard-page').then((module) => ({
    default: module.RecruiterDashboardPage,
  })),
);
const RecruiterJobsPage = lazy(() =>
  import('@/pages/recruiter/recruiter-jobs-page').then((module) => ({
    default: module.RecruiterJobsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/shared/not-found-page').then((module) => ({ default: module.NotFoundPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/shared/notifications-page').then((module) => ({
    default: module.NotificationsPage,
  })),
);

function RoleAppShell() {
  const { user } = useAuth();
  if (!user) return <Navigate replace to="/login" />;
  const shell = <AppShell role={user.role} />;
  return user.role === 'candidate' ? (
    <CandidateOnboardingGate>{shell}</CandidateOnboardingGate>
  ) : (
    shell
  );
}

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div
          aria-live="polite"
          className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground"
          role="status"
        >
          Loading TalentSync…
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route element={<LandingPage />} index />
          <Route element={<LoginPage />} path="login" />
          <Route element={<RegisterPage />} path="register" />
        </Route>

        <Route element={<ProtectedRoute roles={['candidate']} />}>
          <Route element={<OnboardingPage />} path="onboarding" />
          <Route element={<CandidateOnboardingGate />}>
            <Route element={<AppShell role="candidate" />}>
              <Route element={<CandidateDashboardPage />} path="dashboard" />
              <Route element={<ProfilePage />} path="profile" />
              <Route element={<ResumeUploadPage />} path="profile/upload-resume" />
              <Route element={<JobsPage />} path="jobs" />
              <Route element={<JobDetailsPage />} path="jobs/:id" />
              <Route element={<ApplicationsPage />} path="applications" />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['recruiter']} />}>
          <Route element={<AppShell role="recruiter" />}>
            <Route element={<RecruiterDashboardPage />} path="recruiter" />
            <Route element={<RecruiterJobsPage />} path="recruiter/jobs" />
            <Route element={<JobEditorPage />} path="recruiter/jobs/new" />
            <Route element={<JobEditorPage />} path="recruiter/jobs/:id/edit" />
            <Route element={<ApplicantsPage />} path="recruiter/jobs/:id/applicants" />
            <Route element={<ApplicantsPage />} path="recruiter/applicants" />
            <Route element={<AnalyticsPage />} path="recruiter/analytics" />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['candidate', 'recruiter']} />}>
          <Route element={<RoleAppShell />}>
            <Route element={<NotificationsPage />} path="notifications" />
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  );
}
