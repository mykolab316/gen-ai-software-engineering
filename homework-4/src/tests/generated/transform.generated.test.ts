import { describe, it, expect } from 'vitest';
import { filterByStatus, sortByValueDesc, totalValue } from '../../app/lib/transform';
import type { User } from '../../app/lib/transform';

const makeUser = (overrides: Partial<User>): User => ({
  id: 1,
  name: 'Test',
  status: 'active',
  value: 0,
  description: '',
  ...overrides,
});

describe('filterByStatus', () => {
  it('returns users whose status matches the requested status (regression: was inverted with !==)', () => {
    const users: User[] = [
      makeUser({ id: 1, name: 'Alice', status: 'active' }),
      makeUser({ id: 2, name: 'Bob', status: 'inactive' }),
    ];
    const result = filterByStatus(users, 'active');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('returns empty array when no users match the requested status', () => {
    const users: User[] = [
      makeUser({ id: 1, name: 'Alice', status: 'inactive' }),
      makeUser({ id: 2, name: 'Bob', status: 'inactive' }),
    ];
    const result = filterByStatus(users, 'active');
    expect(result).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const users: User[] = [
      makeUser({ id: 1, status: 'active' }),
      makeUser({ id: 2, status: 'inactive' }),
    ];
    const original = [...users];
    filterByStatus(users, 'active');
    expect(users).toEqual(original);
  });
});

describe('sortByValueDesc', () => {
  it('sorts users by value in descending order (regression: was ascending)', () => {
    const users: User[] = [
      makeUser({ id: 1, value: 10 }),
      makeUser({ id: 2, value: 50 }),
      makeUser({ id: 3, value: 30 }),
    ];
    const result = sortByValueDesc(users);
    expect(result.map((u) => u.value)).toEqual([50, 30, 10]);
  });

  it('does not mutate the original input array', () => {
    const users: User[] = [
      makeUser({ id: 1, value: 10 }),
      makeUser({ id: 2, value: 50 }),
    ];
    const originalOrder = users.map((u) => u.value);
    sortByValueDesc(users);
    expect(users.map((u) => u.value)).toEqual(originalOrder);
  });
});

describe('totalValue (control - unchanged behavior)', () => {
  it('sums the value field across users', () => {
    const users: User[] = [
      makeUser({ id: 1, value: 10 }),
      makeUser({ id: 2, value: 20 }),
      makeUser({ id: 3, value: 30 }),
    ];
    expect(totalValue(users)).toBe(60);
  });

  it('returns 0 for an empty array', () => {
    expect(totalValue([])).toBe(0);
  });
});
