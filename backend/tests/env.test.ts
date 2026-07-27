vi.mock('dotenv/config', () => ({}));

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_SERVICE_TIER: process.env.GEMINI_SERVICE_TIER,
};

const restoreVariable = (name: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
};

describe.sequential('production Gemini environment validation', () => {
  afterEach(() => {
    restoreVariable('NODE_ENV', originalEnvironment.NODE_ENV);
    restoreVariable('GEMINI_API_KEY', originalEnvironment.GEMINI_API_KEY);
    restoreVariable('GEMINI_SERVICE_TIER', originalEnvironment.GEMINI_SERVICE_TIER);
    vi.resetModules();
  });

  it.each([
    ['missing and therefore defaults to unpaid', undefined],
    ['explicitly unpaid', 'unpaid'],
  ])('rejects production when GEMINI_SERVICE_TIER is %s', async (_label, serviceTier) => {
    process.env.NODE_ENV = 'production';
    process.env.GEMINI_API_KEY = 'production-gemini-key';
    if (serviceTier === undefined) {
      delete process.env.GEMINI_SERVICE_TIER;
    } else {
      process.env.GEMINI_SERVICE_TIER = serviceTier;
    }
    vi.resetModules();

    await expect(import('../src/config/env.js')).rejects.toThrow(
      /GEMINI_SERVICE_TIER: Must be paid in production/,
    );
  });

  it('accepts production only when the paid tier and required key are configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.GEMINI_API_KEY = 'production-gemini-key';
    process.env.GEMINI_SERVICE_TIER = 'paid';
    vi.resetModules();

    const { env } = await import('../src/config/env.js');

    expect(env.NODE_ENV).toBe('production');
    expect(env.GEMINI_API_KEY).toBe('production-gemini-key');
    expect(env.GEMINI_SERVICE_TIER).toBe('paid');
  });
});
