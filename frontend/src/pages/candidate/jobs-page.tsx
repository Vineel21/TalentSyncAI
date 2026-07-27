import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, Filter, RotateCcw, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { JobCard } from '@/features/jobs/job-card';
import { SaveJobButton, useSavedJobs } from '@/features/saved-jobs/saved-jobs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, PageLoading } from '@/components/ui/state-view';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage, positiveInteger } from '@/lib/utils';
import { jobService } from '@/services/job.service';
import type { EmploymentType } from '@/types/api';

const schema = z.object({
  search: z.string().max(100),
  location: z.string().max(100),
  skills: z.string().max(100),
  employmentType: z.enum([
    '',
    'full_time',
    'part_time',
    'contract',
    'internship',
    'temporary',
    'freelance',
  ]),
  salary: z
    .string()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number.'),
});
type Filters = z.infer<typeof schema>;
const employmentTypes: EmploymentType[] = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
  'freelance',
];

export function JobsPage() {
  useDocumentTitle('Find jobs');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get('page'));
  const requestedEmploymentType = searchParams.get('employmentType');
  const employmentType = employmentTypes.includes(requestedEmploymentType as EmploymentType)
    ? (requestedEmploymentType as EmploymentType)
    : '';
  const defaults: Filters = {
    search: searchParams.get('search') ?? '',
    location: searchParams.get('location') ?? '',
    skills: searchParams.get('skills') ?? '',
    employmentType,
    salary: searchParams.get('salary') ?? '',
  };
  const form = useForm<Filters>({ resolver: zodResolver(schema), defaultValues: defaults });
  const jobs = useQuery({
    queryKey: ['jobs', Object.fromEntries(searchParams)],
    queryFn: () =>
      jobService.list({
        search: searchParams.get('search') ?? undefined,
        location: searchParams.get('location') ?? undefined,
        skills: searchParams.get('skills') ?? undefined,
        employmentType: employmentType || undefined,
        salaryMin: /^\d+$/.test(searchParams.get('salary') ?? '')
          ? Number(searchParams.get('salary'))
          : undefined,
        page,
        limit: 9,
        status: 'open',
      }),
  });
  const savedJobs = useSavedJobs();

  const applyFilters = form.handleSubmit((values) => {
    const next = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value.trim()) next.set(key, value.trim());
    });
    next.set('page', '1');
    setSearchParams(next);
  });

  function clearFilters() {
    form.reset({ search: '', location: '', skills: '', employmentType: '', salary: '' });
    setSearchParams({});
  }

  return (
    <div className="space-y-7">
      <PageHeader
        description="Search open roles and use your profile to understand where you fit."
        eyebrow="Opportunities"
        title="Find your next role"
      />
      <Card className="p-5">
        <form
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr_auto]"
          noValidate
          onSubmit={applyFilters}
        >
          <FormField id="job-search" label="Keywords">
            <Input id="job-search" placeholder="Title or company" {...form.register('search')} />
          </FormField>
          <FormField id="job-location" label="Location">
            <Input id="job-location" placeholder="Remote or city" {...form.register('location')} />
          </FormField>
          <FormField id="job-skills" label="Skills">
            <Input id="job-skills" placeholder="React, Python" {...form.register('skills')} />
          </FormField>
          <FormField id="employment-type" label="Work type">
            <Select id="employment-type" {...form.register('employmentType')}>
              <option value="">All types</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="temporary">Temporary</option>
              <option value="freelance">Freelance</option>
            </Select>
          </FormField>
          <FormField id="salary" label="Min. salary" error={form.formState.errors.salary?.message}>
            <Input
              id="salary"
              inputMode="numeric"
              placeholder="80000"
              {...form.register('salary')}
            />
          </FormField>
          <div className="flex items-end gap-2">
            <Button className="flex-1" type="submit">
              <Search aria-hidden="true" className="h-4 w-4" />
              Search
            </Button>
            <Button
              aria-label="Clear filters"
              onClick={clearFilters}
              size="icon"
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>

      {jobs.isLoading ? (
        <PageLoading label="Searching jobs" />
      ) : jobs.isError ? (
        <ErrorState message={errorMessage(jobs.error)} onRetry={() => void jobs.refetch()} />
      ) : !jobs.data ? (
        <PageLoading label="Searching jobs" />
      ) : jobs.data.items.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={clearFilters} variant="outline">
              <Filter aria-hidden="true" className="h-4 w-4" />
              Clear filters
            </Button>
          }
          description="Try a broader title, remove a filter, or search a different location."
          icon={BriefcaseBusiness}
          title="No jobs match your search"
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{jobs.data.pagination.total}</span>{' '}
              open roles
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.data.items.map((job) => (
              <JobCard
                job={job}
                key={job.id}
                secondaryAction={<SaveJobButton job={job} savedJobs={savedJobs.data} />}
              />
            ))}
          </div>
          <Pagination
            page={jobs.data.pagination.page}
            totalPages={jobs.data.pagination.totalPages}
            onPageChange={(nextPage) => {
              const next = new URLSearchParams(searchParams);
              next.set('page', String(nextPage));
              setSearchParams(next);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
