import { BadRequestError } from '../../shared/errors.js';

export const CURRENT_GEMINI_CONSENT_VERSION = '2026-07-27';

export interface GeminiConsentReceipt {
  version: string | null;
  consentedAt: string | null;
}

interface GeminiConsentFields {
  gemini_consent_version?: string | null;
  gemini_consented_at?: string | null;
}

export const toGeminiConsentReceipt = (
  fields: GeminiConsentFields | null | undefined,
): GeminiConsentReceipt | null => {
  if (!fields) return null;
  return {
    version: fields.gemini_consent_version ?? null,
    consentedAt: fields.gemini_consented_at ?? null,
  };
};

export const assertCurrentGeminiConsentVersion = (version: string): void => {
  if (version !== CURRENT_GEMINI_CONSENT_VERSION) {
    throw new BadRequestError(
      'Current Google Gemini processing consent is required',
      'AI_CONSENT_REQUIRED',
    );
  }
};

export const assertCurrentGeminiConsent = (
  receipt: GeminiConsentReceipt | null | undefined,
): void => {
  if (
    receipt?.version !== CURRENT_GEMINI_CONSENT_VERSION ||
    !receipt.consentedAt ||
    Number.isNaN(Date.parse(receipt.consentedAt))
  ) {
    throw new BadRequestError(
      'Current Google Gemini processing consent is required for this resume',
      'AI_CONSENT_REQUIRED',
    );
  }
};
