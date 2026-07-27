import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api-client';
import { resumeService } from '@/services/resume.service';

vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
  },
  GEMINI_REQUEST_TIMEOUT_MS: 130_000,
}));

describe('resumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a file-only multipart payload', async () => {
    const resume = new File(['%PDF-1.4 synthetic'], 'resume.pdf', {
      type: 'application/pdf',
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'Resume uploaded',
        data: {
          resume: {
            analysisId: 'analysis-1',
            resumePath: 'candidate-1/resume.pdf',
            originalFilename: 'resume.pdf',
            status: 'pending',
          },
        },
      },
    });

    await resumeService.upload(resume);

    expect(api.post).toHaveBeenCalledOnce();
    const [path, body] = vi.mocked(api.post).mock.calls[0] ?? [];
    expect(path).toBe('/resume/upload');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(resume);
    expect([...(body as FormData).keys()]).toEqual(['file']);
  });
});
