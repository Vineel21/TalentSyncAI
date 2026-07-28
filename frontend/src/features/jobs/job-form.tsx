import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { JobInput } from '@/services/job.service';
import type { Job } from '@/types/api';

const numberString = z
  .string()
  .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number.');
const schema = z
  .object({
    title: z.string().trim().min(3, 'Enter a job title.').max(160),
    companyName: z.string().trim().min(2, 'Enter the company name.').max(160),
    location: z.string().trim().min(2, 'Enter a location or Remote.').max(160),
    employmentType: z.enum([
      'full_time',
      'part_time',
      'contract',
      'internship',
      'temporary',
      'freelance',
    ]),
    salaryMin: numberString,
    salaryMax: numberString,
    description: z
      .string()
      .trim()
      .min(100, 'Add at least 100 characters about the role.')
      .max(20_000),
    requirements: z
      .string()
      .trim()
      .min(50, 'Add at least 50 characters of requirements.')
      .max(20_000),
    requiredSkills: z.string().trim().min(2, 'Add at least one required skill.').max(1_000),
    status: z.enum(['open', 'closed', 'draft']),
    expiresAt: z.string(),
  })
  .refine(
    (values) =>
      !values.salaryMin ||
      !values.salaryMax ||
      Number(values.salaryMax) >= Number(values.salaryMin),
    { message: 'Maximum salary must be at least the minimum.', path: ['salaryMax'] },
  );
type FormValues = z.infer<typeof schema>;

export function JobForm({
  job,
  isSubmitting,
  onSubmit,
}: {
  job?: Job;
  isSubmitting: boolean;
  onSubmit: (input: JobInput) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      companyName: '',
      location: '',
      employmentType: 'full_time',
      salaryMin: '',
      salaryMax: '',
      description: '',
      requirements: '',
      requiredSkills: '',
      status: 'draft',
      expiresAt: '',
    },
  });

  useEffect(() => {
    if (!job) return;
    form.reset({
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin?.toString() ?? '',
      salaryMax: job.salaryMax?.toString() ?? '',
      description: job.description,
      requirements: job.requirements,
      requiredSkills: job.requiredSkills.join(', '),
      status: job.status,
      expiresAt: job.expiresAt?.slice(0, 10) ?? '',
    });
  }, [form, job]);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
          salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
          requiredSkills: [
            ...new Set(
              values.requiredSkills
                .split(',')
                .map((skill) => skill.trim())
                .filter(Boolean),
            ),
          ],
          expiresAt: values.expiresAt
            ? new Date(`${values.expiresAt}T23:59:59.000Z`).toISOString()
            : null,
        }),
      )}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role essentials</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <FormField id="title" label="Job title" error={form.formState.errors.title?.message}>
                <Input
                  id="title"
                  placeholder="Senior Product Engineer"
                  {...form.register('title')}
                />
              </FormField>
              <FormField
                id="companyName"
                label="Company name"
                error={form.formState.errors.companyName?.message}
              >
                <Input id="companyName" {...form.register('companyName')} />
              </FormField>
              <FormField
                id="location"
                label="Location"
                error={form.formState.errors.location?.message}
              >
                <Input id="location" placeholder="Remote, US" {...form.register('location')} />
              </FormField>
              <FormField
                id="employmentType"
                label="Employment type"
                error={form.formState.errors.employmentType?.message}
              >
                <Select id="employmentType" {...form.register('employmentType')}>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                  <option value="freelance">Freelance</option>
                </Select>
              </FormField>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Job description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                id="description"
                label="About the role"
                error={form.formState.errors.description?.message}
                hint="Describe responsibilities, impact, team, and what success looks like."
              >
                <Textarea id="description" rows={12} {...form.register('description')} />
              </FormField>
              <FormField
                id="requirements"
                label="Requirements"
                error={form.formState.errors.requirements?.message}
                hint="Use clear, inclusive language and distinguish essentials from nice-to-haves."
              >
                <Textarea id="requirements" rows={9} {...form.register('requirements')} />
              </FormField>
              <FormField
                id="requiredSkills"
                label="Required skills"
                error={form.formState.errors.requiredSkills?.message}
                hint="Separate each skill with a comma."
              >
                <Textarea
                  id="requiredSkills"
                  placeholder="TypeScript, React, Node.js"
                  rows={3}
                  {...form.register('requiredSkills')}
                />
              </FormField>
            </CardContent>
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                id="salaryMin"
                label="Minimum salary"
                error={form.formState.errors.salaryMin?.message}
              >
                <Input
                  id="salaryMin"
                  inputMode="numeric"
                  placeholder="90000"
                  {...form.register('salaryMin')}
                />
              </FormField>
              <FormField
                id="salaryMax"
                label="Maximum salary"
                error={form.formState.errors.salaryMax?.message}
              >
                <Input
                  id="salaryMax"
                  inputMode="numeric"
                  placeholder="130000"
                  {...form.register('salaryMax')}
                />
              </FormField>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField id="status" label="Status" error={form.formState.errors.status?.message}>
                <Select id="status" {...form.register('status')}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </Select>
              </FormField>
              <FormField
                id="expiresAt"
                label="Application deadline"
                error={form.formState.errors.expiresAt?.message}
              >
                <Input
                  id="expiresAt"
                  min={new Date().toISOString().slice(0, 10)}
                  type="date"
                  {...form.register('expiresAt')}
                />
              </FormField>
              <p className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                Open jobs are visible to candidates immediately. Save as a draft if your hiring team
                still needs to review the post.
              </p>
            </CardContent>
          </Card>
          <Button className="w-full" isLoading={isSubmitting} size="lg" type="submit">
            <Save aria-hidden="true" className="h-4 w-4" />
            {job ? 'Save changes' : 'Create job'}
          </Button>
        </div>
      </div>
    </form>
  );
}
