import type { Database } from '../../config/database.types.js';
import { BadRequestError } from '../../shared/errors.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import { toPaginatedResult, type PaginatedResult } from '../../shared/pagination.js';
import type { JobsRepository } from './repository.js';
import type {
  JobCreateInput,
  JobListInput,
  JobUpdateInput,
  JobView,
  JobsContext,
} from './types.js';
import { toJobView } from './types.js';

type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

const ensurePublishable = (status: string, expiresAt: string | null): void => {
  if (status === 'open' && expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    throw new BadRequestError('An expired job cannot be opened', 'JOB_EXPIRED');
  }
};

const ensureFutureExpiration = (expiresAt: string | null): void => {
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    throw new BadRequestError('Job expiration must be in the future', 'JOB_EXPIRED');
  }
};

const toInsert = (recruiterId: string, input: JobCreateInput): JobInsert => ({
  recruiter_id: recruiterId,
  title: input.title,
  company_name: input.companyName,
  location: input.location,
  employment_type: input.employmentType,
  salary_min: input.salaryMin,
  salary_max: input.salaryMax,
  description: input.description,
  requirements: input.requirements,
  required_skills: input.requiredSkills,
  status: input.status,
  expires_at: input.expiresAt,
});

const toUpdate = (input: JobUpdateInput): JobUpdate => {
  const update: JobUpdate = {};
  if ('title' in input) update.title = input.title;
  if ('companyName' in input) update.company_name = input.companyName;
  if ('location' in input) update.location = input.location;
  if ('employmentType' in input) update.employment_type = input.employmentType;
  if ('salaryMin' in input) update.salary_min = input.salaryMin;
  if ('salaryMax' in input) update.salary_max = input.salaryMax;
  if ('description' in input) update.description = input.description;
  if ('requirements' in input) update.requirements = input.requirements;
  if ('requiredSkills' in input) update.required_skills = input.requiredSkills;
  if ('status' in input) {
    update.status = input.status;
  }
  if ('expiresAt' in input) update.expires_at = input.expiresAt;
  return update;
};

export class JobsService {
  public constructor(private readonly repository: JobsRepository) {}

  public async list(
    context: JobsContext,
    filters: JobListInput,
  ): Promise<PaginatedResult<JobView>> {
    const result = await this.repository.list(context.client, filters, context.user);
    return toPaginatedResult(result.rows.map(toJobView), result.total, filters);
  }

  public async get(context: JobsContext, jobId: string): Promise<JobView> {
    const job = await this.repository.findById(context.client, jobId);
    return toJobView(job);
  }

  public async create(context: AuthenticatedContext, input: JobCreateInput): Promise<JobView> {
    ensureFutureExpiration(input.expiresAt);
    ensurePublishable(input.status, input.expiresAt);
    return toJobView(
      await this.repository.create(context.client, toInsert(context.user.id, input)),
    );
  }

  public async update(
    context: AuthenticatedContext,
    jobId: string,
    input: JobUpdateInput,
  ): Promise<JobView> {
    const current = await this.repository.findById(context.client, jobId);
    if (input.expiresAt !== undefined) ensureFutureExpiration(input.expiresAt);
    ensurePublishable(input.status ?? current.status, input.expiresAt ?? current.expires_at);

    const salaryMin = input.salaryMin === undefined ? current.salary_min : input.salaryMin;
    const salaryMax = input.salaryMax === undefined ? current.salary_max : input.salaryMax;
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      throw new BadRequestError('salaryMin cannot exceed salaryMax', 'INVALID_SALARY_RANGE');
    }

    return toJobView(
      await this.repository.update(context.client, context.user.id, jobId, toUpdate(input)),
    );
  }

  public async setStatus(
    context: AuthenticatedContext,
    jobId: string,
    status: 'draft' | 'open' | 'closed',
  ): Promise<JobView> {
    const job = await this.repository.findById(context.client, jobId);
    ensurePublishable(status, job.expires_at);
    return toJobView(
      await this.repository.updateStatus(context.client, context.user.id, jobId, status),
    );
  }

  public async remove(context: AuthenticatedContext, jobId: string): Promise<void> {
    await this.repository.softDelete(context.client, context.user.id, jobId);
  }
}
