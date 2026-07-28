import { DataResetService } from '../src/modules/data-reset/service.js';
import {
  dataResetTableNames,
  type DataResetRepository,
  type DataResetTableCounts,
} from '../src/modules/data-reset/types.js';

const tableCounts = (value: number): DataResetTableCounts =>
  Object.fromEntries(dataResetTableNames.map((table) => [table, value])) as DataResetTableCounts;

const createRepository = (overrides: Partial<DataResetRepository> = {}): DataResetRepository => ({
  listAuthUserIds: vi.fn(() => Promise.resolve([])),
  listStorageBucketIds: vi.fn(() => Promise.resolve(['resume-files'])),
  isStorageBucketEmpty: vi.fn(() => Promise.resolve(true)),
  emptyStorageBucket: vi.fn(() => Promise.resolve()),
  deleteAuthUser: vi.fn(() => Promise.resolve()),
  countPublicTables: vi.fn(() => Promise.resolve(tableCounts(0))),
  ...overrides,
});

describe('DataResetService', () => {
  it('previews counts without invoking any mutation', async () => {
    const repository = createRepository({
      listAuthUserIds: vi.fn(() => Promise.resolve(['user-1', 'user-2'])),
      isStorageBucketEmpty: vi.fn(() => Promise.resolve(false)),
      countPublicTables: vi.fn(() => Promise.resolve(tableCounts(2))),
    });
    const service = new DataResetService(repository, ['resume-files']);

    const snapshot = await service.preview();

    expect(snapshot.authUsers).toBe(2);
    expect(snapshot.storageBucketsEmpty).toEqual({ 'resume-files': false });
    expect(snapshot.tables.users).toBe(2);
    expect(repository.emptyStorageBucket).not.toHaveBeenCalled();
    expect(repository.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('empties Storage before hard-deleting every Auth user and verifies the result', async () => {
    const events: string[] = [];
    const authPages = [['user-1', 'user-2'], ['user-1', 'user-2'], []];
    const bucketStates = [false, true];
    const counts = [tableCounts(2), tableCounts(0)];
    const repository = createRepository({
      listAuthUserIds: vi.fn(() => Promise.resolve(authPages.shift() ?? [])),
      isStorageBucketEmpty: vi.fn(() => Promise.resolve(bucketStates.shift() ?? true)),
      emptyStorageBucket: vi.fn((bucketId) => {
        events.push(`empty:${bucketId}`);
        return Promise.resolve();
      }),
      deleteAuthUser: vi.fn((userId) => {
        events.push(`delete:${userId}`);
        return Promise.resolve();
      }),
      countPublicTables: vi.fn(() => Promise.resolve(counts.shift() ?? tableCounts(0))),
    });
    const service = new DataResetService(repository, ['resume-files']);

    const result = await service.reset();

    expect(events).toEqual(['empty:resume-files', 'delete:user-1', 'delete:user-2']);
    expect(result.deletedAuthUsers).toBe(2);
    expect(result.after.authUsers).toBe(0);
    expect(result.after.tables).toEqual(tableCounts(0));
  });

  it('aborts before mutation when the configured bucket is missing or unexpected', async () => {
    const missingRepository = createRepository({
      listStorageBucketIds: vi.fn(() => Promise.resolve([])),
    });
    await expect(new DataResetService(missingRepository, ['resume-files']).reset()).rejects.toThrow(
      'expected Storage bucket(s) are missing',
    );
    expect(missingRepository.deleteAuthUser).not.toHaveBeenCalled();

    const unexpectedRepository = createRepository({
      listStorageBucketIds: vi.fn(() => Promise.resolve(['resume-files', 'unreviewed-bucket'])),
    });
    await expect(
      new DataResetService(unexpectedRepository, ['resume-files']).reset(),
    ).rejects.toThrow('unexpected Storage bucket(s)');
    expect(unexpectedRepository.emptyStorageBucket).not.toHaveBeenCalled();
    expect(unexpectedRepository.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('does not delete Auth users when emptying Storage fails', async () => {
    const repository = createRepository({
      emptyStorageBucket: vi.fn(() => Promise.reject(new Error('Storage unavailable'))),
    });

    await expect(new DataResetService(repository, ['resume-files']).reset()).rejects.toThrow(
      'Storage unavailable',
    );
    expect(repository.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('fails verification when any data remains', async () => {
    const authPages = [['user-1'], ['user-1'], ['user-still-present']];
    const counts = [tableCounts(1), { ...tableCounts(0), notifications: 1 }];
    const repository = createRepository({
      listAuthUserIds: vi.fn(() => Promise.resolve(authPages.shift() ?? [])),
      countPublicTables: vi.fn(() => Promise.resolve(counts.shift() ?? tableCounts(0))),
    });

    await expect(new DataResetService(repository, ['resume-files']).reset()).rejects.toThrow(
      /auth\.users=1.*public\.notifications=1/,
    );
  });

  it('is idempotent when the database is already empty', async () => {
    const repository = createRepository();
    const result = await new DataResetService(repository, ['resume-files']).reset();

    expect(result.deletedAuthUsers).toBe(0);
    expect(repository.emptyStorageBucket).toHaveBeenCalledWith('resume-files');
    expect(repository.deleteAuthUser).not.toHaveBeenCalled();
  });
});
