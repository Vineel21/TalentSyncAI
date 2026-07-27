import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, GEMINI_REQUEST_TIMEOUT_MS } from '@/lib/api-client';
import { aiService } from '@/services/ai.service';

vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
  },
  GEMINI_REQUEST_TIMEOUT_MS: 130_000,
}));

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests structured resume feedback for an application', async () => {
    const feedback = {
      grammar: ['Use active voice.'],
      ats: ['Add the target job title.'],
      skills: [],
      projects: [],
      formatting: [],
      achievements: ['Quantify the launch impact.'],
    };
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'Resume feedback generated',
        data: { analysis: feedback },
      },
    });

    await expect(aiService.resumeFeedback('application-1')).resolves.toEqual(feedback);
    expect(api.post).toHaveBeenCalledWith(
      '/ai/resume-feedback',
      { applicationId: 'application-1' },
      { timeout: GEMINI_REQUEST_TIMEOUT_MS },
    );
  });
});
