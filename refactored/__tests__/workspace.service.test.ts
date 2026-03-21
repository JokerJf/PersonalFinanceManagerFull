// Tests for resolveWorkspaceConditions logic
// We test the pure logic without DB by mocking AppDataSource

const mockFindOne = jest.fn();

jest.mock('../../src/config/database', () => ({
  AppDataSource: {
    getRepository: () => ({ findOne: mockFindOne }),
  },
}));

import { resolveWorkspaceConditions, resolveFamilyGroupId } from '../../src/services/workspace.service';

beforeEach(() => {
  mockFindOne.mockReset();
});

describe('resolveWorkspaceConditions', () => {
  it('returns userId + familyGroupId IS NULL for personal workspace', async () => {
    const conditions = await resolveWorkspaceConditions(1, 'personal');
    expect(conditions).toMatchObject({ userId: 1 });
    // IsNull() is a special TypeORM object, just check the key exists
    expect('familyGroupId' in conditions).toBe(true);
  });

  it('returns familyGroupId condition when user is in a family group', async () => {
    mockFindOne.mockResolvedValue({ familyGroupId: 42 });
    const conditions = await resolveWorkspaceConditions(1, 'family');
    expect(conditions).toEqual({ familyGroupId: 42 });
  });

  it('returns familyGroupId: -1 when user has no family group', async () => {
    mockFindOne.mockResolvedValue({ familyGroupId: null });
    const conditions = await resolveWorkspaceConditions(1, 'family');
    expect(conditions).toEqual({ familyGroupId: -1 });
  });
});

describe('resolveFamilyGroupId', () => {
  it('returns null for personal workspace without DB call', async () => {
    const result = await resolveFamilyGroupId(1, 'personal');
    expect(result).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('returns familyGroupId for family workspace', async () => {
    mockFindOne.mockResolvedValue({ familyGroupId: 7 });
    const result = await resolveFamilyGroupId(1, 'family');
    expect(result).toBe(7);
  });

  it('throws ApiError if user has no family group', async () => {
    mockFindOne.mockResolvedValue({ familyGroupId: null });
    await expect(resolveFamilyGroupId(1, 'family')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
