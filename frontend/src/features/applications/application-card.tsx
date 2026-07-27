import { ArrowUpRight, Building2, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, friendlyLabel } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/api';

export function statusVariant(status: ApplicationStatus) {
  if (status === 'offer' || status === 'shortlisted') return 'success' as const;
  if (status === 'rejected' || status === 'withdrawn') return 'danger' as const;
  if (status === 'interview' || status === 'under_review') return 'warning' as const;
  return 'default' as const;
}

export function ApplicationCard({ application }: { application: Application }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{application.job?.title ?? 'Job application'}</h2>
            <Badge variant={statusVariant(application.status)}>
              {friendlyLabel(application.status)}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {application.job?.companyName ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 aria-hidden="true" className="h-4 w-4" />
                {application.job.companyName}
              </span>
            ) : null}
            {application.job?.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {application.job.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Applied {formatDate(application.createdAt)}
            </span>
          </div>
        </div>
        {application.aiMatchScore !== null && application.aiMatchScore !== undefined ? (
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-primary">{application.aiMatchScore}%</p>
            <p className="text-xs text-muted-foreground">AI match</p>
          </div>
        ) : null}
      </div>
      {application.job ? (
        <Button asChild className="mt-5" variant="outline">
          <Link className="flex items-center gap-2" to={`/jobs/${application.jobId}`}>
            View job <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </Card>
  );
}
