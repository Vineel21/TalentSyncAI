import type { ApiResponse } from '@/types/api';

export function getData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'The request could not be completed.');
  }
  return response.data;
}
