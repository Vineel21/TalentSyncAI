import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, Profile } from '@/types/api';

export type ProfileInput = Pick<
  Profile,
  | 'fullName'
  | 'phone'
  | 'headline'
  | 'location'
  | 'linkedinUrl'
  | 'githubUrl'
  | 'portfolioUrl'
  | 'summary'
  | 'skills'
  | 'education'
  | 'experience'
  | 'certifications'
>;

export const profileService = {
  async getMine() {
    return getData((await api.get<ApiResponse<{ profile: Profile }>>('/profile')).data).profile;
  },
  async getById(id: string) {
    return getData((await api.get<ApiResponse<{ profile: Profile }>>(`/profile/${id}`)).data)
      .profile;
  },
  async update(input: ProfileInput) {
    return getData((await api.put<ApiResponse<{ profile: Profile }>>('/profile', input)).data)
      .profile;
  },
};
