import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, EmploymentType, Job, JobStatus, Paginated } from '@/types/api';

export interface JobFilters {
  search?: string;
  location?: string;
  skills?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: EmploymentType | '';
  status?: JobStatus | '';
  page?: number;
  limit?: number;
}

export interface JobInput {
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description: string;
  requirements: string;
  requiredSkills: string[];
  status: JobStatus;
  expiresAt?: string | null;
}

export const jobService = {
  async list(filters: JobFilters = {}) {
    return getData(
      (
        await api.get<ApiResponse<Paginated<Job>>>('/jobs', {
          params: filters,
        })
      ).data,
    );
  },
  async get(id: string) {
    return getData((await api.get<ApiResponse<{ job: Job }>>(`/jobs/${id}`)).data).job;
  },
  async create(input: JobInput) {
    return getData((await api.post<ApiResponse<{ job: Job }>>('/jobs', input)).data).job;
  },
  async update(id: string, input: JobInput) {
    return getData((await api.put<ApiResponse<{ job: Job }>>(`/jobs/${id}`, input)).data).job;
  },
  async remove(id: string) {
    return getData((await api.delete<ApiResponse<null>>(`/jobs/${id}`)).data);
  },
  async updateStatus(id: string, status: JobStatus) {
    return getData(
      (await api.patch<ApiResponse<{ job: Job }>>(`/jobs/${id}/status`, { status })).data,
    ).job;
  },
};
