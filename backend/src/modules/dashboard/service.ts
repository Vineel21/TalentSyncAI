import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { DashboardRepository } from './repository.js';
import type { DashboardData } from './types.js';
import { toDashboardData } from './types.js';

export class DashboardService {
  public constructor(private readonly repository: DashboardRepository) {}

  public async get(context: AuthenticatedContext): Promise<DashboardData> {
    const data =
      context.user.role === 'candidate'
        ? await this.repository.candidate(context.client, context.user.id)
        : await this.repository.recruiter(context.client, context.user.id);
    return toDashboardData(data);
  }
}
