import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, CandidateDashboard, RecruiterDashboard } from '@/types/api';

export const dashboardService = {
  async candidate() {
    return getData((await api.get<ApiResponse<CandidateDashboard>>('/dashboard')).data);
  },
  async recruiter() {
    return getData((await api.get<ApiResponse<RecruiterDashboard>>('/dashboard')).data);
  },
};
