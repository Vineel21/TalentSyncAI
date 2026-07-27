import type { AiAnalysisRow, ApplicationRow, Json } from '../src/config/database.types.js';
import type { ResumeFeedbackResult } from '../src/modules/ai/types.js';
import {
  toApplicationView,
  type ApplicationMatchRecommendations,
  type ApplicationRecord,
} from '../src/modules/applications/types.js';

const now = '2026-07-27T00:00:00.000Z';

const application: ApplicationRow = {
  id: '11111111-1111-4111-8111-111111111111',
  job_id: '22222222-2222-4222-8222-222222222222',
  candidate_id: '33333333-3333-4333-8333-333333333333',
  resume_path: '33333333-3333-4333-8333-333333333333/resume.pdf',
  cover_letter: null,
  status: 'under_review',
  ai_match_score: 82,
  created_at: now,
  updated_at: now,
};

const feedback: ResumeFeedbackResult = {
  grammar: ['Use consistent verb tense.'],
  ats: ['Add the target role to the headline.'],
  skills: ['Connect listed skills to work evidence.'],
  projects: [],
  formatting: ['Use consistent section spacing.'],
  achievements: ['Quantify the deployment improvement.'],
};

const completedAnalysis = (): AiAnalysisRow => ({
  id: '44444444-4444-4444-8444-444444444444',
  application_id: application.id,
  status: 'completed',
  match_score: 82,
  candidate_summary: 'Backend engineer with production TypeScript experience.',
  resume_feedback: feedback,
  matching_skills: ['TypeScript', 'PostgreSQL'],
  missing_skills: ['Kubernetes'],
  recommendations: ['good_match', 'The candidate meets the core backend requirements.'],
  model: 'gemini-3.6-flash',
  error_message: null,
  completed_at: now,
  created_at: now,
  updated_at: now,
});

const recordWith = (analysis: AiAnalysisRow): ApplicationRecord => ({
  application,
  job: null,
  profile: null,
  analysis,
});

describe('ApplicationView AI analysis contract', () => {
  it('returns validated, typed feedback and match data', () => {
    const view = toApplicationView(recordWith(completedAnalysis()));

    expect(view.analysis).toEqual({
      status: 'completed',
      matchScore: 82,
      candidateSummary: 'Backend engineer with production TypeScript experience.',
      resumeFeedback: feedback,
      matchingSkills: ['TypeScript', 'PostgreSQL'],
      missingSkills: ['Kubernetes'],
      recommendations: ['good_match', 'The candidate meets the core backend requirements.'],
      model: 'gemini-3.6-flash',
      completedAt: now,
    });

    if (!view.analysis) throw new Error('Expected application analysis');
    expectTypeOf(view.analysis.resumeFeedback).toEqualTypeOf<ResumeFeedbackResult | null>();
    expectTypeOf(view.analysis.matchingSkills).toEqualTypeOf<string[]>();
    expectTypeOf(view.analysis.missingSkills).toEqualTypeOf<string[]>();
    expectTypeOf(view.analysis.recommendations).toEqualTypeOf<ApplicationMatchRecommendations>();
  });

  it('maps the database default empty feedback object to null', () => {
    const view = toApplicationView(
      recordWith({
        ...completedAnalysis(),
        status: 'processing',
        match_score: null,
        candidate_summary: null,
        resume_feedback: {},
        matching_skills: [],
        missing_skills: [],
        recommendations: [],
        completed_at: null,
      }),
    );

    expect(view.analysis).toMatchObject({
      status: 'processing',
      resumeFeedback: null,
      matchingSkills: [],
      missingSkills: [],
      recommendations: [],
    });
  });

  it.each<
    [
      field: keyof Pick<
        AiAnalysisRow,
        'resume_feedback' | 'matching_skills' | 'missing_skills' | 'recommendations'
      >,
      responseField: string,
      invalidValue: Json,
    ]
  >([
    ['resume_feedback', 'resumeFeedback', { grammar: [] }],
    ['matching_skills', 'matchingSkills', ['TypeScript', 42]],
    ['missing_skills', 'missingSkills', 'Kubernetes'],
    ['recommendations', 'recommendations', ['unsupported_recommendation', 'Rationale']],
  ])('rejects invalid persisted %s data', (field, responseField, invalidValue) => {
    let thrown: unknown;
    try {
      toApplicationView(
        recordWith({
          ...completedAnalysis(),
          [field]: invalidValue,
        }),
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      statusCode: 500,
      code: 'INVALID_AI_ANALYSIS_DATA',
      details: [
        {
          field: `analysis.${responseField}`,
          code: 'INVALID_STORED_VALUE',
        },
      ],
    });
  });
});
