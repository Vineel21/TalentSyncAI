import { ArrowUpRight, BriefcaseBusiness, Clock3, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate, friendlyLabel } from '@/lib/utils';
import type { Job } from '@/types/api';

export function JobCard({
  job,
  detailsPath = `/jobs/${job.id}`,
  actionLabel = 'View job',
  secondaryAction,
}: {
  job: Job;
  detailsPath?: string;
  actionLabel?: string;
  secondaryAction?: ReactNode;
}) {
  const salaryMin = formatCurrency(job.salaryMin);
  const salaryMax = formatCurrency(job.salaryMax);
  const salary = salaryMin && salaryMax ? `${salaryMin} – ${salaryMax}` : (salaryMin ?? salaryMax);

  return (
    <Card className="group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-900">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-blue-50 text-primary dark:from-slate-800 dark:to-blue-950">
          <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {job.matchScore !== null && job.matchScore !== undefined ? (
            <Badge variant={job.matchScore >= 75 ? 'success' : 'warning'}>
              {job.matchScore}% match
            </Badge>
          ) : null}
          <Badge variant="secondary">{friendlyLabel(job.employmentType)}</Badge>
        </div>
      </div>
      <div className="mt-4 flex-1">
        <Link className="text-lg font-bold tracking-tight hover:text-primary" to={detailsPath}>
          {job.title}
        </Link>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{job.companyName}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
            {formatDate(job.createdAt)}
          </span>
        </div>
        {salary ? <p className="mt-3 text-sm font-semibold">{salary}</p> : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
          {job.requiredSkills.length > 4 ? (
            <Badge variant="outline">+{job.requiredSkills.length - 4}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Button asChild className="flex-1" variant="outline">
          <Link className="flex w-full items-center justify-center gap-2" to={detailsPath}>
            {actionLabel}
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </Button>
        {secondaryAction}
      </div>
    </Card>
  );
}
