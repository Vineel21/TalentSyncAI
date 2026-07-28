import type { Database } from '../../config/database.types.js';

export const dataResetTableNames = [
  'users',
  'profiles',
  'jobs',
  'applications',
  'resume_analyses',
  'ai_analyses',
  'notifications',
  'saved_jobs',
] as const satisfies readonly (keyof Database['public']['Tables'])[];

export type DataResetTableName = (typeof dataResetTableNames)[number];

export type DataResetTableCounts = Record<DataResetTableName, number>;

export interface DataResetSnapshot {
  authUsers: number;
  storageBuckets: string[];
  storageBucketsEmpty: Record<string, boolean>;
  tables: DataResetTableCounts;
}

export interface DataResetResult {
  before: DataResetSnapshot;
  deletedAuthUsers: number;
  emptiedStorageBuckets: string[];
  after: DataResetSnapshot;
}

export type DataResetProgress =
  | {
      kind: 'storage_bucket_emptied';
      bucketId: string;
    }
  | {
      kind: 'auth_user_deleted';
      completed: number;
      total: number;
    };

export interface DataResetRepository {
  listAuthUserIds(): Promise<string[]>;
  listStorageBucketIds(): Promise<string[]>;
  isStorageBucketEmpty(bucketId: string): Promise<boolean>;
  emptyStorageBucket(bucketId: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
  countPublicTables(): Promise<DataResetTableCounts>;
}
