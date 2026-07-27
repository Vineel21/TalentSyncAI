import type { ResumeParseResult } from '../ai/types.js';

export interface ResumeUploadResult {
  analysisId: string;
  resumePath: string;
  originalFilename: string;
  status: 'pending';
}

export interface ResumeUploadInput {
  geminiConsentVersion: string;
}

export interface ResumeParseResponse {
  analysisId: string;
  status: 'completed';
  parsed: ResumeParseResult;
}

export interface ResumeDownloadResult {
  buffer: Buffer;
  filename: string;
}

export interface ResumeDownloadQuery {
  applicationId?: string;
}
