import { z, type ZodType } from 'zod';
import type {
  AiAnalysisRow,
  ApplicationRow,
  ApplicationStatus,
  JobRow,
  ProfileRow,
} from '../../config/database.types.js';
import { AppError } from '../../shared/errors.js';
import type { PaginationInput } from '../../shared/pagination.js';
import {
  matchResultSchema,
  resumeFeedbackResultSchema,
  type MatchResult,
  type ResumeFeedbackResult,
} from '../ai/types.js';
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

export type ApplicationMatchRecommendations =
  | []
  | [recommendation: MatchResult['recommendation'], rationale: MatchResult['rationale']];

export interface ApplicationAnalysisView {
  status: AiAnalysisRow['status'];
  matchScore: number | null;
  candidateSummary: string | null;
  resumeFeedback: ResumeFeedbackResult | null;
  matchingSkills: MatchResult['matchingSkills'];
  missingSkills: MatchResult['missingSkills'];
  recommendations: ApplicationMatchRecommendations;
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

const storedResumeFeedbackSchema = z.union([
  resumeFeedbackResultSchema,
  z
    .object({})
    .strict()
    .transform(() => null),
]);

const storedRecommendationsSchema = z.union([
  z.tuple([]),
  z.tuple([matchResultSchema.shape.recommendation, matchResultSchema.shape.rationale]),
]);

const parseAnalysisField = <T>(field: string, schema: ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(500, 'INVALID_AI_ANALYSIS_DATA', 'Stored AI analysis data is invalid', [
      {
        field: `analysis.${field}`,
        code: 'INVALID_STORED_VALUE',
        message: `Stored ${field} does not match the application analysis contract`,
      },
    ]);
  }
  return parsed.data;
};

const toApplicationAnalysisView = (analysis: AiAnalysisRow): ApplicationAnalysisView => ({
  status: analysis.status,
  matchScore: analysis.match_score,
  candidateSummary: analysis.candidate_summary,
  resumeFeedback: parseAnalysisField(
    'resumeFeedback',
    storedResumeFeedbackSchema,
    analysis.resume_feedback,
  ),
  matchingSkills: parseAnalysisField(
    'matchingSkills',
    matchResultSchema.shape.matchingSkills,
    analysis.matching_skills,
  ),
  missingSkills: parseAnalysisField(
    'missingSkills',
    matchResultSchema.shape.missingSkills,
    analysis.missing_skills,
  ),
  recommendations: parseAnalysisField(
    'recommendations',
    storedRecommendationsSchema,
    analysis.recommendations,
  ),
  model: analysis.model,
  completedAt: analysis.completed_at,
});

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
  analysis: record.analysis ? toApplicationAnalysisView(record.analysis) : null,
  createdAt: record.application.created_at,
  updatedAt: record.application.updated_at,
});
