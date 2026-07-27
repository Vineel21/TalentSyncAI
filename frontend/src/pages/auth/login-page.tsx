import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '@/features/auth/auth-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.email('Enter a valid email address.').max(254),
  password: z.string().min(1, 'Enter your password.').max(72, 'Password is too long.'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  useDocumentTitle('Sign in');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isBootstrapping } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (!isBootstrapping && user) {
    return <Navigate replace to={user.role === 'recruiter' ? '/recruiter' : '/dashboard'} />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const signedInUser = await login(values);
      const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname;
      const fallback = signedInUser.role === 'recruiter' ? '/recruiter' : '/dashboard';
      toast.success('Welcome back', 'Your workspace is ready.');
      navigate(requestedPath ?? fallback, { replace: true });
    } catch (error) {
      toast.error('Sign in failed', errorMessage(error));
    }
  });

  return (
    <AuthCard
      description="Continue to your personalized hiring workspace."
      footer={
        <>
          New to TalentSync?{' '}
          <Link className="font-semibold text-primary hover:underline" to="/register">
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
    >
      <form className="space-y-5" noValidate onSubmit={onSubmit}>
        <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
          <Input
            aria-invalid={Boolean(form.formState.errors.email)}
            autoComplete="email"
            id="email"
            placeholder="you@company.com"
            type="email"
            {...form.register('email')}
          />
        </FormField>
        <FormField id="password" label="Password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input
              aria-invalid={Boolean(form.formState.errors.password)}
              autoComplete="current-password"
              className="pr-11"
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...form.register('password')}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>
        <Button className="w-full" isLoading={form.formState.isSubmitting} type="submit">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
