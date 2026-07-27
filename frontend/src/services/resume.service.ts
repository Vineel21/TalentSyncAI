import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, ResumeParseResult } from '@/types/api';

export const resumeService = {
  async upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return getData(
      (
        await api.post<
          ApiResponse<{
            resume: {
              analysisId: string;
              resumePath: string;
              originalFilename: string;
              status: 'pending';
            };
          }>
        >('/resume/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60_000,
        })
      ).data,
    );
  },
  async parse() {
    return getData(
      (
        await api.post<
          ApiResponse<{
            analysis: { analysisId: string; status: 'completed'; parsed: ResumeParseResult };
          }>
        >('/resume/parse', undefined, {
          timeout: 60_000,
        })
      ).data,
    ).analysis.parsed;
  },
  async download(applicationId?: string) {
    const response = await api.get<Blob>('/resume/download', {
      params: applicationId ? { applicationId } : undefined,
      responseType: 'blob',
    });
    return response.data;
  },
};
