import {
  assertDataResetAllowed,
  expectedResetConfirmation,
  parseDataResetArguments,
  parseDataResetEnvironment,
  projectRefFromUrl,
} from '../src/modules/data-reset/validation.js';

const projectRef = 'ouxjdcgbeljmysfwifgd';

const resetEnvironment = (overrides: NodeJS.ProcessEnv = {}) =>
  parseDataResetEnvironment({
    NODE_ENV: 'development',
    SUPABASE_URL: `https://${projectRef}.supabase.co`,
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_RESUME_BUCKET: 'resume-files',
    ...overrides,
  });

describe('data reset validation', () => {
  it('derives hosted and local project references', () => {
    expect(projectRefFromUrl(`https://${projectRef}.supabase.co`)).toBe(projectRef);
    expect(projectRefFromUrl('http://127.0.0.1:54321')).toBe('local');
  });

  it('rejects unsupported Supabase URL hosts', () => {
    expect(() => projectRefFromUrl('https://database.example.com')).toThrow(
      /Unsupported Supabase URL host/,
    );
  });

  it('defaults to a read-only preview', () => {
    const arguments_ = parseDataResetArguments([]);

    expect(arguments_).toEqual({
      allowRemote: false,
      apply: false,
      confirmation: null,
      help: false,
    });
    expect(assertDataResetAllowed(resetEnvironment(), arguments_)).toBe(projectRef);
  });

  it('rejects unknown and conflicting CLI options', () => {
    expect(() => parseDataResetArguments(['--aply'])).toThrow('Unknown data reset option: --aply');
    expect(() => parseDataResetArguments(['--apply', '--dry-run'])).toThrow(
      '--apply and --dry-run cannot be used together',
    );
  });

  it('requires the environment allowlist, remote flag, and target-bound confirmation', () => {
    const confirmation = expectedResetConfirmation(projectRef);
    const baseArguments = parseDataResetArguments([
      '--apply',
      '--allow-remote',
      `--confirm=${confirmation}`,
    ]);

    expect(() => assertDataResetAllowed(resetEnvironment(), baseArguments)).toThrow(
      `Set DATA_RESET_ALLOWED_PROJECT_REF=${projectRef}`,
    );

    expect(() =>
      assertDataResetAllowed(
        resetEnvironment({ DATA_RESET_ALLOWED_PROJECT_REF: projectRef }),
        parseDataResetArguments(['--apply', `--confirm=${confirmation}`]),
      ),
    ).toThrow('A hosted Supabase reset requires --allow-remote');

    expect(() =>
      assertDataResetAllowed(
        resetEnvironment({ DATA_RESET_ALLOWED_PROJECT_REF: projectRef }),
        parseDataResetArguments(['--apply', '--allow-remote', '--confirm=WRONG_TARGET']),
      ),
    ).toThrow(`A reset requires --confirm=${confirmation}`);

    expect(
      assertDataResetAllowed(
        resetEnvironment({ DATA_RESET_ALLOWED_PROJECT_REF: projectRef }),
        baseArguments,
      ),
    ).toBe(projectRef);
  });

  it('refuses to erase data in production without an override', () => {
    const arguments_ = parseDataResetArguments([
      '--apply',
      '--allow-remote',
      `--confirm=${expectedResetConfirmation(projectRef)}`,
    ]);

    expect(() =>
      assertDataResetAllowed(
        resetEnvironment({
          NODE_ENV: 'production',
          DATA_RESET_ALLOWED_PROJECT_REF: projectRef,
        }),
        arguments_,
      ),
    ).toThrow('Data reset is disabled when NODE_ENV=production');
  });
});
