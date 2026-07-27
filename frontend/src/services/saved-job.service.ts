import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, SavedJob } from '@/types/api';

export const savedJobService = {
  async list() {
    return getData((await api.get<ApiResponse<{ savedJobs: SavedJob[] }>>('/saved-jobs')).data)
      .savedJobs;
  },
  async save(jobId: string) {
    return getData(
      (await api.post<ApiResponse<{ savedJob: SavedJob }>>(`/saved-jobs/${jobId}`)).data,
    ).savedJob;
  },
  async remove(jobId: string) {
    await api.delete<ApiResponse<null>>(`/saved-jobs/${jobId}`);
  },
};
