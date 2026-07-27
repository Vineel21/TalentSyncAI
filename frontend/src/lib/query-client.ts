import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof error.response === 'object' &&
          error.response !== null &&
          'status' in error.response &&
          typeof error.response.status === 'number' &&
          error.response.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
