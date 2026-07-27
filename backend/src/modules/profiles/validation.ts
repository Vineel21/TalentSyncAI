import { z } from 'zod';

const optionalNullableText = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

const optionalNullableUrl = z
  .union([z.url({ protocol: /^https$/ }).max(2_048), z.literal('')])
  .transform((value) => value || null)
  .nullable()
  .optional();

const educationEntrySchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(200),
  fieldOfStudy: z.string().trim().min(1).max(200).nullable().default(null),
  startDate: z.iso.date().nullable().default(null),
  endDate: z.iso.date().nullable().default(null),
  description: z.string().trim().max(2_000).nullable().default(null),
});

const experienceEntrySchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    location: z.string().trim().min(1).max(200).nullable().default(null),
    startDate: z.iso.date().nullable().default(null),
    endDate: z.iso.date().nullable().default(null),
    current: z.boolean().default(false),
    description: z.string().trim().max(4_000).nullable().default(null),
  })
  .refine((entry) => !entry.current || entry.endDate === null, {
    message: 'Current roles cannot have an end date',
    path: ['endDate'],
  });

const certificationEntrySchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().min(1).max(200).nullable().default(null),
  issuedAt: z.iso.date().nullable().default(null),
  credentialUrl: z
    .url({ protocol: /^https$/ })
    .max(2_048)
    .nullable()
    .default(null),
});

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160).optional(),
    phone: optionalNullableText(30),
    headline: optionalNullableText(240),
    location: optionalNullableText(160),
    linkedinUrl: optionalNullableUrl,
    githubUrl: optionalNullableUrl,
    portfolioUrl: optionalNullableUrl,
    summary: z.string().trim().max(4_000).optional(),
    skills: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
    education: z.array(educationEntrySchema).max(30).optional(),
    experience: z.array(experienceEntrySchema).max(50).optional(),
    certifications: z.array(certificationEntrySchema).max(50).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one profile field is required',
  });

export const profileIdParamsSchema = z.object({
  id: z.uuid(),
});
