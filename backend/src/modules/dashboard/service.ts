import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { SavedJobsRepository } from '../saved-jobs/repository.js';
import type { DashboardRepository } from './repository.js';
import type { DashboardData } from './types.js';
import {
  recruiterActivityWindowEnd,
  recruiterActivityWindowStart,
  toDashboardData,
} from './types.js';

export class DashboardService {
  public constructor(
    private readonly repository: DashboardRepository,
    private readonly savedJobsRepository: SavedJobsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async get(context: AuthenticatedContext): Promise<DashboardData> {
    const referenceDate = this.now();
    if (context.user.role === 'candidate') {
      const [data, savedJobs] = await Promise.all([
        this.repository.candidate(context.client, context.user.id),
        this.savedJobsRepository.list(context.client, context.user.id, 3),
      ]);
      return toDashboardData(data, referenceDate, savedJobs);
    }

    const data = await this.repository.recruiter(
      context.client,
      context.user.id,
      recruiterActivityWindowStart(referenceDate).toISOString(),
      recruiterActivityWindowEnd(referenceDate).toISOString(),
    );
    return toDashboardData(data, referenceDate);
  }
}
