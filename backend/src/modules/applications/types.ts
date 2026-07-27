import type {
  AiAnalysisRow,
  ApplicationRow,
  ApplicationStatus,
  JobRow,
  ProfileRow,
} from '../../config/database.types.js';
import type { PaginationInput } from '../../shared/pagination.js';
import type { JobView } from '../jobs/types.js';
import { toJobView } from '../jobs/types.js';
import type { ProfileView } from '../profiles/types.js';
import { toProfileView } from '../profiles/types.js';

export interface ApplicationCreateInput {
  jobId: string;
  coverLetter: string | null;
}

export interface ApplicationListInput extends PaginationInput {
  status?: ApplicationStatus;
  jobId?: string;
}

export interface ApplicationRecord {
  application: ApplicationRow;
  job: JobRow | null;
  profile: ProfileRow | null;
  analysis: AiAnalysisRow | null;
}

export interface ApplicationAnalysisView {
  status: AiAnalysisRow['status'];
  matchScore: number | null;
  candidateSummary: string | null;
  resumeFeedback: unknown;
  matchingSkills: unknown;
  missingSkills: unknown;
  recommendations: unknown;
  model: string | null;
  completedAt: string | null;
}

export interface ApplicationView {
  id: string;
  jobId: string;
  candidateId: string;
  resumePath: string;
  coverLetter: string | null;
  status: ApplicationStatus;
  aiMatchScore: number | null;
  job: JobView | null;
  candidateProfile: ProfileView | null;
  analysis: ApplicationAnalysisView | null;
  createdAt: string;
  updatedAt: string;
}

export const toApplicationView = (record: ApplicationRecord): ApplicationView => ({
  id: record.application.id,
  jobId: record.application.job_id,
  candidateId: record.application.candidate_id,
  resumePath: record.application.resume_path,
  coverLetter: record.application.cover_letter,
  status: record.application.status,
  aiMatchScore: record.application.ai_match_score,
  job: record.job ? toJobView(record.job) : null,
  candidateProfile: record.profile ? toProfileView(record.profile) : null,
  analysis: record.analysis
    ? {
        status: record.analysis.status,
        matchScore: record.analysis.match_score,
        candidateSummary: record.analysis.candidate_summary,
        resumeFeedback: record.analysis.resume_feedback,
        matchingSkills: record.analysis.matching_skills,
        missingSkills: record.analysis.missing_skills,
        recommendations: record.analysis.recommendations,
        model: record.analysis.model,
        completedAt: record.analysis.completed_at,
      }
    : null,
  createdAt: record.application.created_at,
  updatedAt: record.application.updated_at,
});
