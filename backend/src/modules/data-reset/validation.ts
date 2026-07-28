import { z } from 'zod';

const RESET_CONFIRMATION_PREFIX = 'RESET_ALL_DATA_';

const resetEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_RESUME_BUCKET: z.string().min(1).default('resume-files'),
  DATA_RESET_ALLOWED_PROJECT_REF: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export type DataResetEnvironment = z.infer<typeof resetEnvironmentSchema>;

export interface DataResetArguments {
  allowRemote: boolean;
  apply: boolean;
  confirmation: string | null;
  help: boolean;
}

export const parseDataResetEnvironment = (environment: NodeJS.ProcessEnv): DataResetEnvironment => {
  const result = resetEnvironmentSchema.safeParse(environment);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid data reset environment: ${issues}`);
};

export const projectRefFromUrl = (supabaseUrl: string): string => {
  const url = new URL(supabaseUrl);
  const hostname = url.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'local';
  }

  if (hostname.endsWith('.supabase.co')) {
    const projectRef = hostname.slice(0, -'.supabase.co'.length);
    if (!/^[a-z0-9]+$/.test(projectRef)) {
      throw new Error(`Unable to derive a valid Supabase project reference from ${url.origin}`);
    }
    return projectRef;
  }

  throw new Error(
    `Unsupported Supabase URL host ${hostname}; this reset script supports local Supabase and hosted *.supabase.co projects`,
  );
};

export const isRemoteSupabaseUrl = (supabaseUrl: string): boolean =>
  projectRefFromUrl(supabaseUrl) !== 'local';

export const expectedResetConfirmation = (projectRef: string): string =>
  `${RESET_CONFIRMATION_PREFIX}${projectRef}`;

export const parseDataResetArguments = (arguments_: string[]): DataResetArguments => {
  let apply = false;
  let dryRun = false;
  let allowRemote = false;
  let help = false;
  let confirmation: string | null = null;

  for (const argument of arguments_) {
    if (argument === '--apply') {
      apply = true;
      continue;
    }
    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (argument === '--allow-remote') {
      allowRemote = true;
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      help = true;
      continue;
    }
    if (argument.startsWith('--confirm=')) {
      if (confirmation !== null) {
        throw new Error('--confirm may be provided only once');
      }
      confirmation = argument.slice('--confirm='.length);
      continue;
    }
    throw new Error(`Unknown data reset option: ${argument}`);
  }

  if (apply && dryRun) {
    throw new Error('--apply and --dry-run cannot be used together');
  }

  return { allowRemote, apply, confirmation, help };
};

export const assertDataResetAllowed = (
  environment: DataResetEnvironment,
  arguments_: DataResetArguments,
): string => {
  const projectRef = projectRefFromUrl(environment.SUPABASE_URL);

  if (!arguments_.apply) return projectRef;

  if (environment.NODE_ENV === 'production') {
    throw new Error(
      'Data reset is disabled when NODE_ENV=production. Use a reviewed backup and recovery runbook instead.',
    );
  }

  if (
    environment.DATA_RESET_ALLOWED_PROJECT_REF === undefined ||
    environment.DATA_RESET_ALLOWED_PROJECT_REF !== projectRef
  ) {
    throw new Error(
      `Set DATA_RESET_ALLOWED_PROJECT_REF=${projectRef} to explicitly allow this target`,
    );
  }

  if (isRemoteSupabaseUrl(environment.SUPABASE_URL) && !arguments_.allowRemote) {
    throw new Error('A hosted Supabase reset requires --allow-remote');
  }

  const expectedConfirmation = expectedResetConfirmation(projectRef);
  if (arguments_.confirmation !== expectedConfirmation) {
    throw new Error(`A reset requires --confirm=${expectedConfirmation}`);
  }

  return projectRef;
};
