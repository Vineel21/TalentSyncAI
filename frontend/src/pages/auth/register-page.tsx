import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '@/features/auth/auth-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(200),
    email: z.email('Enter a valid email address.').max(254),
    role: z.enum(['candidate', 'recruiter']),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use no more than 72 characters.')
      .regex(/[A-Z]/, 'Include one uppercase letter.')
      .regex(/[a-z]/, 'Include one lowercase letter.')
      .regex(/[0-9]/, 'Include one number.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  useDocumentTitle('Create account');
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const { register, user, isBootstrapping } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate';
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      role,
      password: '',
      confirmPassword: '',
    },
  });

  if (!isBootstrapping && user) {
    return <Navigate replace to={user.role === 'recruiter' ? '/recruiter' : '/onboarding'} />;
  }

  if (verificationEmail) {
    return (
      <AuthCard
        description="Email verification protects your account and hiring data."
        footer={
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Return to sign in
          </Link>
        }
        title="Check your inbox"
      >
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            We sent a verification link to{' '}
            <span className="font-semibold text-foreground">{verificationEmail}</span>. Verify your
            email, then sign in.
          </p>
        </div>
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        password: values.password,
      });
      if (result.requiresVerification) {
        setVerificationEmail(values.email);
        return;
      }
      toast.success('Account created', 'Let’s set up your workspace.');
      navigate(result.user.role === 'recruiter' ? '/recruiter' : '/onboarding', {
        replace: true,
      });
    } catch (error) {
      toast.error('Registration failed', errorMessage(error));
    }
  });

  return (
    <AuthCard
      description="Join as a candidate or hiring team. You can’t change this role later."
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
      title="Create your account"
    >
      <form className="space-y-4" noValidate onSubmit={onSubmit}>
        <FormField id="fullName" label="Full name" error={form.formState.errors.fullName?.message}>
          <Input
            autoComplete="name"
            id="fullName"
            placeholder="Alex Morgan"
            {...form.register('fullName')}
          />
        </FormField>
        <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
          <Input
            autoComplete="email"
            id="email"
            placeholder="you@company.com"
            type="email"
            {...form.register('email')}
          />
        </FormField>
        <FormField id="role" label="I’m joining as" error={form.formState.errors.role?.message}>
          <Select id="role" {...form.register('role')}>
            <option value="candidate">Candidate — I’m looking for a role</option>
            <option value="recruiter">Recruiter — I’m hiring talent</option>
          </Select>
        </FormField>
        <FormField
          id="password"
          label="Password"
          error={form.formState.errors.password?.message}
          hint="At least 8 characters with uppercase, lowercase, and a number."
        >
          <div className="relative">
            <Input
              autoComplete="new-password"
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
        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            autoComplete="new-password"
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            {...form.register('confirmPassword')}
          />
        </FormField>
        <p className="text-xs leading-5 text-muted-foreground">
          By creating an account, you confirm that you are 18 or older and understand that AI
          recommendations are decision support; people remain responsible for hiring decisions.
        </p>
        <Button className="w-full" isLoading={form.formState.isSubmitting} type="submit">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
