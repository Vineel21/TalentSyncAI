import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/auth-provider';
import { ThemeProvider } from '@/features/shared/theme-provider';
import { ToastProvider } from '@/features/shared/toast-provider';
import { queryClient } from '@/lib/query-client';
import { AppRouter } from '@/routes/app-router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
