import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  role: z.enum(['candidate', 'recruiter']),
});

export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
});
