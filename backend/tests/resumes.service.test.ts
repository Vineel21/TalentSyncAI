import type {
  ApplicationRow,
  ProfileRow,
  ResumeAnalysisRow,
  UserRow,
} from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { CURRENT_GEMINI_CONSENT_VERSION } from '../src/modules/ai/consent.js';
import type { AiService } from '../src/modules/ai/service.js';
import type { ResumesRepository } from '../src/modules/resumes/repository.js';
import { ResumesService } from '../src/modules/resumes/service.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const now = '2026-07-27T00:00:00.000Z';
const recruiter: UserRow = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'recruiter@example.com',
  role: 'recruiter',
  created_at: now,
  updated_at: now,
};
const candidateId = '22222222-2222-4222-8222-222222222222';
const submittedPath = `${candidateId}/submitted.pdf`;
const context: AuthenticatedContext = {
  user: recruiter,
  accessToken: 'access-token',
  client: {} as DatabaseClient,
};
const candidate: UserRow = {
  ...recruiter,
  id: candidateId,
  email: 'candidate@example.com',
  role: 'candidate',
};
const candidateContext: AuthenticatedContext = {
  ...context,
  user: candidate,
};
const uploadedFile = {
  originalname: 'candidate-resume',
  buffer: Buffer.from('%PDF-test'),
  mimetype: 'application/pdf',
  size: 9,
} as Express.Multer.File;

describe('ResumesService', () => {
  it('downloads the immutable application resume snapshot for recruiters', async () => {
    const application: ApplicationRow = {
      id: '33333333-3333-4333-8333-333333333333',
      job_id: '44444444-4444-4444-8444-444444444444',
      candidate_id: candidateId,
      resume_path: submittedPath,
      cover_letter: null,
      status: 'under_review',
      ai_match_score: null,
      created_at: now,
      updated_at: now,
    };
    const repository = {
      findApplication: vi.fn().mockResolvedValue(application),
      findAnalysisByPath: vi.fn().mockResolvedValue({
        original_filename: 'submitted-resume.pdf',
      }),
      downloadObject: vi.fn().mockResolvedValue(Buffer.from('%PDF-test')),
      findProfile: vi.fn(),
    } as unknown as ResumesRepository;
    const service = new ResumesService(repository, {} as AiService);

    const result = await service.download(context, application.id);

    expect(result.filename).toBe('submitted-resume.pdf');
    expect(repository.findAnalysisByPath).toHaveBeenCalledWith(
      context.client,
      candidateId,
      submittedPath,
    );
    expect(repository.downloadObject).toHaveBeenCalledWith(submittedPath);
    expect(repository.findProfile).not.toHaveBeenCalled();
  });

  it('retains previously uploaded objects that may be referenced by applications', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const profile = {
      resume_path: `${candidateId}/previous.pdf`,
    } as ProfileRow;
    const analysis = {
      id: '55555555-5555-4555-8555-555555555555',
    } as ResumeAnalysisRow;
    const repository = {
      findProfile: vi.fn().mockResolvedValue(profile),
      uploadObject: vi.fn().mockResolvedValue(undefined),
      createAnalysis: vi.fn().mockResolvedValue(analysis),
      updateProfile: vi.fn().mockResolvedValue(profile),
      deleteObject: vi.fn(),
    } as unknown as ResumesRepository;
    const service = new ResumesService(repository, {} as AiService);

    try {
      const result = await service.upload(
        candidateContext,
        uploadedFile,
        CURRENT_GEMINI_CONSENT_VERSION,
      );

      expect(result.originalFilename).toBe('candidate-resume.pdf');
      expect(repository.createAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: candidateId,
          original_filename: 'candidate-resume.pdf',
          status: 'pending',
          gemini_consent_version: CURRENT_GEMINI_CONSENT_VERSION,
          gemini_consented_at: now,
        }),
      );
      expect(repository.deleteObject).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    {
      label: 'has no consent receipt',
      gemini_consent_version: null,
      gemini_consented_at: null,
    },
    {
      label: 'has a stale consent version',
      gemini_consent_version: '2026-07-26',
      gemini_consented_at: now,
    },
    {
      label: 'has no consent timestamp',
      gemini_consent_version: CURRENT_GEMINI_CONSENT_VERSION,
      gemini_consented_at: null,
    },
  ])('rejects parsing when the current resume $label', async (receipt) => {
    const resumePath = `${candidateId}/current.pdf`;
    const repository = {
      findProfile: vi.fn().mockResolvedValue({
        resume_path: resumePath,
      }),
      findAnalysisByPath: vi.fn().mockResolvedValue({
        id: '55555555-5555-4555-8555-555555555555',
        user_id: candidateId,
        storage_path: resumePath,
        ...receipt,
      }),
      updateAnalysis: vi.fn(),
      downloadObject: vi.fn(),
    } as unknown as ResumesRepository;
    const aiService = {
      parseResume: vi.fn(),
    } as unknown as AiService;
    const service = new ResumesService(repository, aiService);

    await expect(service.parse(candidateContext)).rejects.toMatchObject({
      code: 'AI_CONSENT_REQUIRED',
      statusCode: 400,
    });
    expect(repository.findAnalysisByPath).toHaveBeenCalledWith(
      candidateContext.client,
      candidateId,
      resumePath,
    );
    expect(repository.updateAnalysis).not.toHaveBeenCalled();
    expect(repository.downloadObject).not.toHaveBeenCalled();
    expect(aiService.parseResume).not.toHaveBeenCalled();
  });
});
