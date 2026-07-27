import type { JobRow, SavedJobRow } from '../../config/database.types.js';
import type { JobView } from '../jobs/types.js';
import { toJobView } from '../jobs/types.js';

export interface SavedJobRecord {
  savedJob: SavedJobRow;
  job: JobRow;
}

export interface SavedJobView {
  job: JobView;
  savedAt: string;
}

export const toSavedJobView = ({ savedJob, job }: SavedJobRecord): SavedJobView => ({
  job: toJobView(job),
  savedAt: savedJob.created_at,
});
