import type {
  JobRow,
  OnboardingSource as DatabaseOnboardingSource,
  OnboardingStep as DatabaseOnboardingStep,
  ProfileRow,
} from '../../config/database.types.js';
import type { MatchResult } from '../ai/types.js';
import type { JobView } from '../jobs/types.js';

export type OnboardingStep = DatabaseOnboardingStep;
export type OnboardingSource = DatabaseOnboardingSource;

export interface OnboardingProgressInput {
  step: OnboardingStep;
  source?: OnboardingSource;
}

export interface CompleteOnboardingInput {
  skippedRecommendations: boolean;
}

export type OnboardingProfile = Pick<
  ProfileRow,
  | 'user_id'
  | 'full_name'
  | 'headline'
  | 'location'
  | 'summary'
  | 'skills'
  | 'education'
  | 'experience'
  | 'onboarding_step'
  | 'onboarding_source'
  | 'onboarding_completed_at'
  | 'recommendations_skipped_at'
>;

export interface OnboardingView {
  currentStep: OnboardingStep;
  source: OnboardingSource | null;
  completedAt: string | null;
  recommendationsSkippedAt: string | null;
}

export interface RecommendationView {
  job: JobView;
  match: MatchResult;
  aiGenerated: boolean;
}

export interface RankedJob {
  job: JobRow;
  fallbackMatch: MatchResult;
}

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const tokenize = (value: string): Set<string> =>
  new Set(
    normalize(value)
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((token) => token.length > 1),
  );

const recommendationForScore = (score: number): MatchResult['recommendation'] => {
  if (score >= 90) return 'excellent_match';
  if (score >= 75) return 'good_match';
  if (score >= 60) return 'average_match';
  return 'poor_match';
};

const hasStructuredEntry = (value: unknown, requiredFields: string[]): boolean =>
  Array.isArray(value) &&
  value.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      !Array.isArray(entry) &&
      requiredFields.every((field) => {
        const fieldValue = (entry as Record<string, unknown>)[field];
        return typeof fieldValue === 'string' && fieldValue.trim().length > 0;
      }),
  );

export const missingReadinessFields = (profile: OnboardingProfile): string[] => {
  const missing: string[] = [];
  if (!profile.full_name.trim()) missing.push('fullName');
  if (!profile.headline?.trim()) missing.push('headline');
  if (!profile.location?.trim()) missing.push('location');
  if (!profile.summary.trim()) missing.push('summary');
  if (asStringArray(profile.skills).length === 0) missing.push('skills');
  if (
    !hasStructuredEntry(profile.education, ['institution', 'degree']) &&
    !hasStructuredEntry(profile.experience, ['company', 'title'])
  ) {
    missing.push('educationOrExperience');
  }
  return missing;
};

export const toOnboardingView = (profile: OnboardingProfile): OnboardingView => ({
  currentStep: profile.onboarding_step,
  source: profile.onboarding_source,
  completedAt: profile.onboarding_completed_at,
  recommendationsSkippedAt: profile.recommendations_skipped_at,
});

export const fallbackMatchForJob = (profile: OnboardingProfile, job: JobRow): MatchResult => {
  const candidateSkills = new Set(asStringArray(profile.skills).map(normalize));
  const requiredSkills = asStringArray(job.required_skills);
  const matchingSkills = requiredSkills.filter((skill) => candidateSkills.has(normalize(skill)));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.has(normalize(skill)));

  const skillRatio =
    requiredSkills.length === 0 ? 0 : matchingSkills.length / requiredSkills.length;
  const headlineTokens = tokenize(profile.headline ?? '');
  const titleTokens = tokenize(job.title);
  const matchingTitleTokens = [...titleTokens].filter((token) => headlineTokens.has(token)).length;
  const titleRatio = titleTokens.size === 0 ? 0 : matchingTitleTokens / titleTokens.size;

  const candidateLocation = normalize(profile.location ?? '');
  const jobLocation = normalize(job.location);
  const locationMatches =
    jobLocation.includes('remote') ||
    (candidateLocation.length > 0 &&
      (candidateLocation === jobLocation ||
        candidateLocation.includes(jobLocation) ||
        jobLocation.includes(candidateLocation)));

  const score = Math.min(
    100,
    Math.round(skillRatio * 75 + titleRatio * 15 + (locationMatches ? 10 : 0)),
  );
  const skillSummary =
    requiredSkills.length === 0
      ? 'The role has no explicit skill list.'
      : `${matchingSkills.length} of ${requiredSkills.length} required skills match.`;

  return {
    score,
    matchingSkills,
    missingSkills,
    recommendation: recommendationForScore(score),
    rationale: `${skillSummary} The score also considers headline and location alignment.`,
  };
};

export const rankRecommendationJobs = (
  profile: OnboardingProfile,
  jobs: JobRow[],
  limit = 3,
): RankedJob[] =>
  jobs
    .map((job) => ({
      job,
      fallbackMatch: fallbackMatchForJob(profile, job),
    }))
    .sort(
      (left, right) =>
        right.fallbackMatch.score - left.fallbackMatch.score ||
        right.job.created_at.localeCompare(left.job.created_at) ||
        left.job.id.localeCompare(right.job.id),
    )
    .slice(0, limit);
