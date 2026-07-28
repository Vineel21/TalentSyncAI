vi.mock('dotenv/config', () => ({}));

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_SERVICE_TIER: process.env.GEMINI_SERVICE_TIER,
  AI_PROCESSING_MODE: process.env.AI_PROCESSING_MODE,
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
    restoreVariable('AI_PROCESSING_MODE', originalEnvironment.AI_PROCESSING_MODE);
    vi.resetModules();
  });

  it('accepts a production assessment deployment without a Gemini key or paid-tier claim', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_SERVICE_TIER = 'unpaid';
    process.env.AI_PROCESSING_MODE = 'assessment';
    vi.resetModules();

    const { env } = await import('../src/config/env.js');

    expect(env.NODE_ENV).toBe('production');
    expect(env.AI_PROCESSING_MODE).toBe('assessment');
    expect(env.GEMINI_SERVICE_TIER).toBe('unpaid');
    expect(env.GEMINI_API_KEY).toBeUndefined();
  });

  it('rejects live processing when the Gemini service tier is unpaid', async () => {
    process.env.NODE_ENV = 'production';
    process.env.GEMINI_API_KEY = 'production-gemini-key';
    process.env.GEMINI_SERVICE_TIER = 'unpaid';
    process.env.AI_PROCESSING_MODE = 'live';
    vi.resetModules();

    await expect(import('../src/config/env.js')).rejects.toThrow(
      /GEMINI_SERVICE_TIER: Must be paid when AI_PROCESSING_MODE is live/,
    );
  });

  it('rejects live processing without a Gemini API key', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_SERVICE_TIER = 'paid';
    process.env.AI_PROCESSING_MODE = 'live';
    vi.resetModules();

    await expect(import('../src/config/env.js')).rejects.toThrow(
      /GEMINI_API_KEY: Required when AI_PROCESSING_MODE is live/,
    );
  });

  it('accepts live processing only when the paid tier and required key are configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.GEMINI_API_KEY = 'production-gemini-key';
    process.env.GEMINI_SERVICE_TIER = 'paid';
    process.env.AI_PROCESSING_MODE = 'live';
    vi.resetModules();

    const { env } = await import('../src/config/env.js');

    expect(env.NODE_ENV).toBe('production');
    expect(env.GEMINI_API_KEY).toBe('production-gemini-key');
    expect(env.GEMINI_SERVICE_TIER).toBe('paid');
    expect(env.AI_PROCESSING_MODE).toBe('live');
  });
});
