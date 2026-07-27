import type { AuthenticatedContext } from '../../shared/request-context.js';
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
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async get(context: AuthenticatedContext): Promise<DashboardData> {
    const referenceDate = this.now();
    const data =
      context.user.role === 'candidate'
        ? await this.repository.candidate(context.client, context.user.id)
        : await this.repository.recruiter(
            context.client,
            context.user.id,
            recruiterActivityWindowStart(referenceDate).toISOString(),
            recruiterActivityWindowEnd(referenceDate).toISOString(),
          );
    return toDashboardData(data, referenceDate);
  }
}
