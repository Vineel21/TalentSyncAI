import { z } from 'zod';

const nullableText = z.string().nullable();
const nullableHttpsUrl = z.url({ protocol: /^https$/ }).nullable();

export const educationSchema = z.object({
  institution: z.string(),
  degree: nullableText,
  fieldOfStudy: nullableText,
  startDate: nullableText,
  endDate: nullableText,
  description: nullableText,
});

export const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: nullableText,
  startDate: nullableText,
  endDate: nullableText,
  current: z.boolean(),
  description: nullableText,
});

export const certificationSchema = z.object({
  name: z.string(),
  issuer: nullableText,
  issuedAt: nullableText,
  credentialUrl: nullableHttpsUrl,
});

export const resumeParseResultSchema = z.object({
  name: nullableText,
  email: z.email().nullable(),
  phone: nullableText,
  headline: nullableText,
  location: nullableText,
  linkedin: nullableHttpsUrl,
  github: nullableHttpsUrl,
  portfolio: nullableHttpsUrl,
  summary: nullableText,
  skills: z.array(z.string()),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  certifications: z.array(certificationSchema),
});

export const matchResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  recommendation: z.enum(['excellent_match', 'good_match', 'average_match', 'poor_match']),
  rationale: z.string(),
});

export const candidateSummaryResultSchema = z.object({
  summary: z.string(),
});

export const resumeFeedbackResultSchema = z.object({
  grammar: z.array(z.string()),
  ats: z.array(z.string()),
  skills: z.array(z.string()),
  projects: z.array(z.string()),
  formatting: z.array(z.string()),
  achievements: z.array(z.string()),
});

export type ResumeParseResult = z.infer<typeof resumeParseResultSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
export type CandidateSummaryResult = z.infer<typeof candidateSummaryResultSchema>;
export type ResumeFeedbackResult = z.infer<typeof resumeFeedbackResultSchema>;

export type MatchAnalysisInput = { jobId: string } | { applicationId: string };

export interface ApplicationAnalysisInput {
  applicationId: string;
}
