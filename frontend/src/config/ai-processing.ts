export type AiProcessingMode = 'assessment' | 'live';

export const aiProcessingMode = (): AiProcessingMode =>
  import.meta.env.VITE_AI_PROCESSING_MODE === 'live' ? 'live' : 'assessment';

export const isLiveAiProcessingEnabled = (): boolean => aiProcessingMode() === 'live';

export const assessmentModeMessage =
  'Live AI processing is disabled in this assessment deployment. No newly uploaded resume or profile data is sent to Gemini. Use manual profile entry; seeded demo accounts retain their prepared AI results.';
