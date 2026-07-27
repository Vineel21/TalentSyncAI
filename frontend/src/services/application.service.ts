import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, Application, ApplicationStatus, Paginated } from '@/types/api';

export interface ApplicationFilters {
  page?: number;
  limit?: number;
  jobId?: string;
  status?: ApplicationStatus | '';
}

export const applicationService = {
  async list(filters: ApplicationFilters = {}) {
    return getData(
      (
        await api.get<ApiResponse<Paginated<Application>>>('/applications', {
          params: filters,
        })
      ).data,
    );
  },
  async get(id: string) {
    return getData(
      (await api.get<ApiResponse<{ application: Application }>>(`/applications/${id}`)).data,
    ).application;
  },
  async create(input: { jobId: string; coverLetter?: string }) {
    return getData(
      (
        await api.post<ApiResponse<{ application: Application }>>('/applications', {
          jobId: input.jobId,
          coverLetter: input.coverLetter || null,
        })
      ).data,
    ).application;
  },
  async updateStatus(id: string, status: ApplicationStatus) {
    return getData(
      (
        await api.patch<ApiResponse<{ application: Application }>>(`/applications/${id}/status`, {
          status,
        })
      ).data,
    ).application;
  },
  async withdraw(id: string) {
    return getData((await api.delete<ApiResponse<null>>(`/applications/${id}`)).data);
  },
};
