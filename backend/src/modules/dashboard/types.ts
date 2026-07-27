import type { ApplicationRow, JobRow } from '../../config/database.types.js';
import type { ApplicationRecord, ApplicationView } from '../applications/types.js';
import { toApplicationView } from '../applications/types.js';
import type { JobView } from '../jobs/types.js';
import { toJobView } from '../jobs/types.js';
import type { SavedJobRecord, SavedJobView } from '../saved-jobs/types.js';
import { toSavedJobView } from '../saved-jobs/types.js';

export interface CandidateDashboardStats {
  profileCompletion: number;
  totalApplications: number;
  underReview: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  unreadNotifications: number;
}

export interface RecruiterDashboardStats {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  pending: number;
  shortlisted: number;
  interviews: number;
  rejected: number;
  offers: number;
  unreadNotifications: number;
}

export type DashboardActivityApplication = Pick<ApplicationRow, 'created_at' | 'status'>;

export interface DashboardAnalyticsPoint {
  label: string;
  applicants: number;
  interviews: number;
}

export interface DashboardRepositoryData {
  stats: CandidateDashboardStats | RecruiterDashboardStats;
  recentApplications: ApplicationRecord[];
  recommendedJobs: JobRow[];
  recentJobs: JobRow[];
  recentApplicants: ApplicationRecord[];
  activityApplications: DashboardActivityApplication[];
}

export interface DashboardData {
  stats: CandidateDashboardStats | RecruiterDashboardStats;
  recentApplications: ApplicationView[];
  recommendedJobs: JobView[];
  recentJobs: JobView[];
  recentApplicants: ApplicationView[];
  analytics: DashboardAnalyticsPoint[];
  savedJobs: SavedJobView[];
}

const monthLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

export const recruiterActivityWindowStart = (referenceDate: Date): Date =>
  new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 5, 1));

export const recruiterActivityWindowEnd = (referenceDate: Date): Date =>
  new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));

export const buildRecruiterActivity = (
  applications: DashboardActivityApplication[],
  referenceDate: Date,
): DashboardAnalyticsPoint[] => {
  if (applications.length === 0) return [];

  const windowStart = recruiterActivityWindowStart(referenceDate);
  const buckets = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(
      Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth() + offset, 1),
    );
    return {
      key: date.toISOString().slice(0, 7),
      point: {
        label: monthLabel.format(date),
        applicants: 0,
        interviews: 0,
      },
    };
  });
  const pointsByMonth = new Map(buckets.map(({ key, point }) => [key, point]));
  let includedApplications = 0;

  for (const application of applications) {
    const point = pointsByMonth.get(application.created_at.slice(0, 7));
    if (!point) continue;
    includedApplications += 1;
    point.applicants += 1;
    // Without immutable status events, interview and offer are the two current
    // stages that prove the application reached interview progression.
    if (application.status === 'interview' || application.status === 'offer') {
      point.interviews += 1;
    }
  }

  return includedApplications > 0 ? buckets.map(({ point }) => point) : [];
};

export const toDashboardData = (
  data: DashboardRepositoryData,
  referenceDate = new Date(),
  savedJobs: SavedJobRecord[] = [],
): DashboardData => ({
  stats: data.stats,
  recentApplications: data.recentApplications.map(toApplicationView),
  recommendedJobs: data.recommendedJobs.map(toJobView),
  recentJobs: data.recentJobs.map(toJobView),
  recentApplicants: data.recentApplicants.map(toApplicationView),
  analytics: buildRecruiterActivity(data.activityApplications, referenceDate),
  savedJobs: savedJobs.map(toSavedJobView),
});
