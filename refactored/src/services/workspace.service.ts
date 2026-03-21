import { IsNull, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entity/User';
import { Workspace } from '../types';

/**
 * Resolves TypeORM where-conditions for personal vs family workspace.
 * Centralises the duplicated logic that was spread across account/debt/transaction routes.
 */
export async function resolveWorkspaceConditions<T extends { userId?: number; familyGroupId?: number | null }>(
  userId: number,
  workspace: Workspace,
): Promise<FindOptionsWhere<T>> {
  if (workspace === 'family') {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    const familyGroupId = user?.familyGroupId;
    // Return a condition that finds nothing if user has no group
    return { familyGroupId: familyGroupId ?? -1 } as FindOptionsWhere<T>;
  }
  return { userId, familyGroupId: IsNull() } as FindOptionsWhere<T>;
}

/**
 * Returns the familyGroupId for a user if the workspace is 'family', or null otherwise.
 * Throws if workspace is 'family' but user is not in any group.
 */
export async function resolveFamilyGroupId(
  userId: number,
  workspace: Workspace,
  errorMessage = 'You are not in a family group',
): Promise<number | null> {
  if (workspace !== 'family') return null;

  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
  if (!user?.familyGroupId) {
    const { ApiError } = await import('../middleware/errorHandler');
    throw new ApiError(errorMessage, 400);
  }
  return user.familyGroupId;
}
