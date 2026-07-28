import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../config/database.types.js';
import {
  dataResetTableNames,
  type DataResetRepository,
  type DataResetTableCounts,
  type DataResetTableName,
} from './types.js';

type ResetClient = SupabaseClient<Database>;

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
};

const failOnError = (error: unknown, context: string): void => {
  if (error) throw new Error(`${context}: ${errorMessage(error)}`);
};

export class SupabaseDataResetRepository implements DataResetRepository {
  public constructor(private readonly client: ResetClient) {}

  public async listAuthUserIds(): Promise<string[]> {
    const userIds: string[] = [];
    const perPage = 1_000;
    let page = 1;

    while (true) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage });
      failOnError(error, `Unable to list Auth users (page ${page})`);
      userIds.push(...data.users.map((user) => user.id));
      if (data.users.length < perPage) return userIds;
      page += 1;
    }
  }

  public async listStorageBucketIds(): Promise<string[]> {
    const { data, error } = await this.client.storage.listBuckets({
      limit: 1_000,
      sortColumn: 'id',
      sortOrder: 'asc',
    });
    failOnError(error, 'Unable to list Storage buckets');
    if (!data) throw new Error('Unable to list Storage buckets: no data returned');
    return data.map((bucket) => bucket.id);
  }

  public async isStorageBucketEmpty(bucketId: string): Promise<boolean> {
    const { data, error } = await this.client.storage.from(bucketId).list('', {
      limit: 1,
      offset: 0,
    });
    failOnError(error, `Unable to inspect Storage bucket ${bucketId}`);
    if (!data) throw new Error(`Unable to inspect Storage bucket ${bucketId}: no data returned`);
    return data.length === 0;
  }

  public async emptyStorageBucket(bucketId: string): Promise<void> {
    const { error } = await this.client.storage.emptyBucket(bucketId);
    failOnError(error, `Unable to empty Storage bucket ${bucketId}`);
  }

  public async deleteAuthUser(userId: string): Promise<void> {
    const { error } = await this.client.auth.admin.deleteUser(userId, false);
    failOnError(error, `Unable to hard-delete Auth user ${userId}`);
  }

  public async countPublicTables(): Promise<DataResetTableCounts> {
    const entries = await Promise.all(
      dataResetTableNames.map(async (table): Promise<readonly [DataResetTableName, number]> => {
        const { count, error } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true });
        failOnError(error, `Unable to count public.${table}`);
        return [table, count ?? 0] as const;
      }),
    );

    return Object.fromEntries(entries) as DataResetTableCounts;
  }
}
