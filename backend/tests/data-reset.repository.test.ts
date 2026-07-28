import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/config/database.types.js';
import { SupabaseDataResetRepository } from '../src/modules/data-reset/repository.js';

const clientWithAdminMethods = (
  listUsers: ReturnType<typeof vi.fn>,
  deleteUser: ReturnType<typeof vi.fn> = vi.fn(),
): SupabaseClient<Database> =>
  ({
    auth: {
      admin: {
        listUsers,
        deleteUser,
      },
    },
  }) as unknown as SupabaseClient<Database>;

describe('SupabaseDataResetRepository', () => {
  it('collects every Auth user before deletion across paginated results', async () => {
    const firstPage = Array.from({ length: 1_000 }, (_, index) => ({
      id: `user-${index}`,
    }));
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({ data: { users: firstPage }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ id: 'user-1000' }] }, error: null });
    const repository = new SupabaseDataResetRepository(clientWithAdminMethods(listUsers));

    const userIds = await repository.listAuthUserIds();

    expect(userIds).toHaveLength(1_001);
    expect(userIds.at(-1)).toBe('user-1000');
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1_000 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1_000 });
  });

  it('explicitly requests a hard delete for Auth identities', async () => {
    const deleteUser = vi.fn().mockResolvedValue({ data: null, error: null });
    const repository = new SupabaseDataResetRepository(clientWithAdminMethods(vi.fn(), deleteUser));

    await repository.deleteAuthUser('user-1');

    expect(deleteUser).toHaveBeenCalledExactlyOnceWith('user-1', false);
  });

  it('propagates Auth deletion errors with the affected user id', async () => {
    const deleteUser = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Storage ownership prevents deletion' },
    });
    const repository = new SupabaseDataResetRepository(clientWithAdminMethods(vi.fn(), deleteUser));

    await expect(repository.deleteAuthUser('user-1')).rejects.toThrow(
      'Unable to hard-delete Auth user user-1: Storage ownership prevents deletion',
    );
  });
});
