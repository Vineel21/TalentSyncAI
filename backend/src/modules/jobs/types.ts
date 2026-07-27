import type { EmploymentType, JobRow, JobStatus, UserRow } from '../../config/database.types.js';
import type { DatabaseClient } from '../../config/supabase.js';
import type { PaginationInput } from '../../shared/pagination.js';

export interface JobCreateInput {
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string;
  requiredSkills: string[];
  status: JobStatus;
  expiresAt: string | null;
}

export type JobUpdateInput = Partial<JobCreateInput>;

export interface JobListInput extends PaginationInput {
  search?: string;
  location?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: EmploymentType;
  status?: JobStatus;
}

export interface JobsContext {
  client: DatabaseClient;
  user: Pick<UserRow, 'id' | 'role'> | null;
}

export interface JobView {
  id: string;
  recruiterId: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string;
  requiredSkills: unknown;
  status: JobStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toJobView = (job: JobRow): JobView => ({
  id: job.id,
  recruiterId: job.recruiter_id,
  title: job.title,
  companyName: job.company_name,
  location: job.location,
  employmentType: job.employment_type,
  salaryMin: job.salary_min,
  salaryMax: job.salary_max,
  description: job.description,
  requirements: job.requirements,
  requiredSkills: job.required_skills,
  status: job.status,
  expiresAt: job.expires_at,
  createdAt: job.created_at,
  updatedAt: job.updated_at,
});
