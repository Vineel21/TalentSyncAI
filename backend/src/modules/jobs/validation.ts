import { z } from 'zod';

const employmentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
  'freelance',
]);
const jobStatusSchema = z.enum(['draft', 'open', 'closed']);

const nullableSalary = z.number().int().min(0).max(100_000_000).nullable();

const jobFields = {
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(160),
  employmentType: employmentTypeSchema,
  salaryMin: nullableSalary.default(null),
  salaryMax: nullableSalary.default(null),
  description: z.string().trim().min(20).max(50_000),
  requirements: z.string().trim().min(10).max(30_000),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).min(1).max(100),
  status: jobStatusSchema.default('draft'),
  expiresAt: z.iso.datetime({ offset: true }).nullable().default(null),
};

const validSalaryRange = (job: { salaryMin?: number | null; salaryMax?: number | null }) =>
  job.salaryMin === null ||
  job.salaryMin === undefined ||
  job.salaryMax === null ||
  job.salaryMax === undefined ||
  job.salaryMin <= job.salaryMax;

export const jobCreateSchema = z.object(jobFields).refine(validSalaryRange, {
  message: 'salaryMin cannot exceed salaryMax',
  path: ['salaryMax'],
});

export const jobUpdateSchema = z
  .object(jobFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one job field is required',
  })
  .refine(validSalaryRange, {
    message: 'salaryMin cannot exceed salaryMax',
    path: ['salaryMax'],
  });

export const jobStatusUpdateSchema = z.object({
  status: jobStatusSchema,
});

export const jobIdParamsSchema = z.object({
  id: z.uuid(),
});

export const jobListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(200).optional(),
    location: z.string().trim().min(1).max(200).optional(),
    skills: z
      .union([z.string(), z.array(z.string())])
      .transform((value) =>
        (Array.isArray(value) ? value : value.split(','))
          .map((skill) => skill.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().max(100)).max(20))
      .optional(),
    salaryMin: z.coerce.number().int().min(0).max(100_000_000).optional(),
    salaryMax: z.coerce.number().int().min(0).max(100_000_000).optional(),
    employmentType: employmentTypeSchema.optional(),
    status: jobStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(validSalaryRange, {
    message: 'salaryMin cannot exceed salaryMax',
    path: ['salaryMax'],
  });
