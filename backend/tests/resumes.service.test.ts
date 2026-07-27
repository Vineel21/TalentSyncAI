import type {
  ApplicationRow,
  ProfileRow,
  ResumeAnalysisRow,
  UserRow,
} from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
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
    const file = {
      originalname: 'candidate-resume',
      buffer: Buffer.from('%PDF-test'),
      mimetype: 'application/pdf',
      size: 9,
    } as Express.Multer.File;

    const result = await service.upload(candidateContext, file);

    expect(result.originalFilename).toBe('candidate-resume.pdf');
    expect(repository.deleteObject).not.toHaveBeenCalled();
  });
});
