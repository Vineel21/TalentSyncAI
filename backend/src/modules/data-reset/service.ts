import type {
  DataResetProgress,
  DataResetRepository,
  DataResetResult,
  DataResetSnapshot,
} from './types.js';

export type DataResetProgressListener = (progress: DataResetProgress) => void;

const nonEmptyTableSummary = (snapshot: DataResetSnapshot): string =>
  Object.entries(snapshot.tables)
    .filter(([, count]) => count > 0)
    .map(([table, count]) => `public.${table}=${count}`)
    .join(', ');

export class DataResetService {
  public constructor(
    private readonly repository: DataResetRepository,
    private readonly allowedStorageBuckets: readonly string[],
    private readonly onProgress?: DataResetProgressListener,
  ) {}

  public async preview(): Promise<DataResetSnapshot> {
    const [authUserIds, storageBuckets, tables] = await Promise.all([
      this.repository.listAuthUserIds(),
      this.repository.listStorageBucketIds(),
      this.repository.countPublicTables(),
    ]);
    const storageEntries = await Promise.all(
      storageBuckets.map(
        async (bucketId): Promise<readonly [string, boolean]> => [
          bucketId,
          await this.repository.isStorageBucketEmpty(bucketId),
        ],
      ),
    );
    const storageBucketsEmpty: Record<string, boolean> = Object.fromEntries(storageEntries);

    return {
      authUsers: authUserIds.length,
      storageBuckets,
      storageBucketsEmpty,
      tables,
    };
  }

  public async reset(): Promise<DataResetResult> {
    const before = await this.preview();
    const allowedBuckets = new Set(this.allowedStorageBuckets);
    const missingBuckets = this.allowedStorageBuckets.filter(
      (bucketId) => !before.storageBuckets.includes(bucketId),
    );
    if (missingBuckets.length > 0) {
      throw new Error(
        `Reset aborted before mutation: expected Storage bucket(s) are missing: ${missingBuckets.join(', ')}`,
      );
    }

    const unexpectedBuckets = before.storageBuckets.filter(
      (bucketId) => !allowedBuckets.has(bucketId),
    );
    if (unexpectedBuckets.length > 0) {
      throw new Error(
        `Reset aborted before mutation: unexpected Storage bucket(s) require an explicit code review: ${unexpectedBuckets.join(', ')}`,
      );
    }

    for (const bucketId of this.allowedStorageBuckets) {
      await this.repository.emptyStorageBucket(bucketId);
      this.onProgress?.({ kind: 'storage_bucket_emptied', bucketId });
    }

    const authUserIds = await this.repository.listAuthUserIds();
    for (const [index, userId] of authUserIds.entries()) {
      await this.repository.deleteAuthUser(userId);
      this.onProgress?.({
        kind: 'auth_user_deleted',
        completed: index + 1,
        total: authUserIds.length,
      });
    }

    const after = await this.preview();
    const nonEmptyBuckets = Object.entries(after.storageBucketsEmpty)
      .filter(([, isEmpty]) => !isEmpty)
      .map(([bucketId]) => bucketId);
    const nonEmptyTables = nonEmptyTableSummary(after);

    if (after.authUsers > 0 || nonEmptyBuckets.length > 0 || nonEmptyTables.length > 0) {
      const remaining = [
        after.authUsers > 0 ? `auth.users=${after.authUsers}` : null,
        nonEmptyBuckets.length > 0
          ? `non-empty Storage buckets=${nonEmptyBuckets.join(', ')}`
          : null,
        nonEmptyTables || null,
      ].filter((value): value is string => value !== null);
      throw new Error(`Data reset verification failed; remaining data: ${remaining.join('; ')}`);
    }

    return {
      before,
      deletedAuthUsers: authUserIds.length,
      emptiedStorageBuckets: [...this.allowedStorageBuckets],
      after,
    };
  }
}
