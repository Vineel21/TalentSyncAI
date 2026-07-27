import type { ApplicationStatus, Database } from '../../config/database.types.js';
import { BadRequestError, ConflictError } from '../../shared/errors.js';
import type { PaginatedResult } from '../../shared/pagination.js';
import { toPaginatedResult } from '../../shared/pagination.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { ApplicationsRepository } from './repository.js';
import type { ApplicationCreateInput, ApplicationListInput, ApplicationView } from './types.js';
import { toApplicationView } from './types.js';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ['under_review', 'shortlisted', 'rejected'],
  under_review: ['shortlisted', 'interview', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  rejected: [],
  offer: [],
  withdrawn: [],
};

export class ApplicationsService {
  public constructor(private readonly repository: ApplicationsRepository) {}

  public async create(
    context: AuthenticatedContext,
    input: ApplicationCreateInput,
  ): Promise<ApplicationView> {
    const [job, profile, duplicate] = await Promise.all([
      this.repository.findJob(context.client, input.jobId),
      this.repository.findCandidateProfile(context.client, context.user.id),
      this.repository.findDuplicate(context.client, context.user.id, input.jobId),
    ]);

    if (job.status !== 'open') {
      throw new BadRequestError('This job is not accepting applications', 'JOB_NOT_OPEN');
    }
    if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) {
      throw new BadRequestError('This job has expired', 'JOB_EXPIRED');
    }
    if (!profile.resume_path) {
      throw new BadRequestError('Upload a resume before applying', 'RESUME_REQUIRED');
    }
    if (duplicate) {
      throw new ConflictError('You have already applied to this job', 'DUPLICATE_APPLICATION');
    }

    const insert: ApplicationInsert = {
      job_id: job.id,
      candidate_id: context.user.id,
      resume_path: profile.resume_path,
      cover_letter: input.coverLetter,
    };
    return toApplicationView(await this.repository.create(context.client, insert));
  }

  public async list(
    context: AuthenticatedContext,
    input: ApplicationListInput,
  ): Promise<PaginatedResult<ApplicationView>> {
    const result = await this.repository.list(context.client, input, context.user);
    return toPaginatedResult(result.records.map(toApplicationView), result.total, input);
  }

  public async get(context: AuthenticatedContext, applicationId: string): Promise<ApplicationView> {
    return toApplicationView(
      await this.repository.findById(
        context.client,
        applicationId,
        context.user.role === 'recruiter',
      ),
    );
  }

  public async updateStatus(
    context: AuthenticatedContext,
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<ApplicationView> {
    const current = await this.repository.findById(context.client, applicationId, true);
    if (!allowedTransitions[current.application.status].includes(status)) {
      throw new BadRequestError(
        `Cannot move an application from ${current.application.status} to ${status}`,
        'INVALID_STATUS_TRANSITION',
      );
    }
    return toApplicationView(
      await this.repository.updateStatus(context.client, applicationId, status),
    );
  }

  public async withdraw(context: AuthenticatedContext, applicationId: string): Promise<void> {
    const current = await this.repository.findById(context.client, applicationId, false);
    if (['rejected', 'withdrawn'].includes(current.application.status)) {
      throw new BadRequestError(
        'A finalized application cannot be withdrawn',
        'APPLICATION_FINALIZED',
      );
    }
    await this.repository.withdraw(context.client, context.user.id, applicationId);
  }
}
