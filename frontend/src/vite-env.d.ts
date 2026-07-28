/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROCESSING_MODE?: 'assessment' | 'live';
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
