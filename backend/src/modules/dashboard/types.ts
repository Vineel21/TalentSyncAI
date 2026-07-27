import type { JobRow } from '../../config/database.types.js';
import type { ApplicationRecord, ApplicationView } from '../applications/types.js';
import { toApplicationView } from '../applications/types.js';
import type { JobView } from '../jobs/types.js';
import { toJobView } from '../jobs/types.js';

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

export interface DashboardRepositoryData {
  stats: CandidateDashboardStats | RecruiterDashboardStats;
  recentApplications: ApplicationRecord[];
  recommendedJobs: JobRow[];
  recentJobs: JobRow[];
  recentApplicants: ApplicationRecord[];
}

export interface DashboardData {
  stats: CandidateDashboardStats | RecruiterDashboardStats;
  recentApplications: ApplicationView[];
  recommendedJobs: JobView[];
  recentJobs: JobView[];
  recentApplicants: ApplicationView[];
}

export const toDashboardData = (data: DashboardRepositoryData): DashboardData => ({
  stats: data.stats,
  recentApplications: data.recentApplications.map(toApplicationView),
  recommendedJobs: data.recommendedJobs.map(toJobView),
  recentJobs: data.recentJobs.map(toJobView),
  recentApplicants: data.recentApplicants.map(toApplicationView),
});
