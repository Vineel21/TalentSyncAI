import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { SavedJobsRepository } from './repository.js';
import type { SavedJobView } from './types.js';
import { toSavedJobView } from './types.js';

export class SavedJobsService {
  public constructor(
    private readonly repository: SavedJobsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async list(context: AuthenticatedContext): Promise<SavedJobView[]> {
    const records = await this.repository.list(context.client, context.user.id);
    return records.map(toSavedJobView);
  }

  public async save(context: AuthenticatedContext, jobId: string): Promise<SavedJobView> {
    const job = await this.repository.findOpenJob(context.client, jobId, this.now().toISOString());
    const savedJob =
      (await this.repository.find(context.client, context.user.id, jobId)) ??
      (await this.repository.save(context.client, context.user.id, jobId));
    return toSavedJobView({ savedJob, job });
  }

  public async remove(context: AuthenticatedContext, jobId: string): Promise<void> {
    await this.repository.remove(context.client, context.user.id, jobId);
  }
}
