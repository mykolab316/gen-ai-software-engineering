import { describe, it, expect } from 'vitest';
import { filterByStatus, sortByValueDesc, totalValue, type User } from '../app/lib/transform';

const users: User[] = [
  { id: 1, name: 'A', status: 'active', value: 10, description: '' },
  { id: 2, name: 'B', status: 'inactive', value: 30, description: '' },
  { id: 3, name: 'C', status: 'active', value: 20, description: '' },
];

describe('filterByStatus', () => {
  it('keeps only users matching the requested status', () => {
    expect(filterByStatus(users, 'active').map((u) => u.id)).toEqual([1, 3]);
  });

  it('returns an empty array when nothing matches', () => {
    const inactiveOnly: User[] = [users[0], users[2]];
    expect(filterByStatus(inactiveOnly, 'inactive')).toEqual([]);
  });
});

describe('sortByValueDesc', () => {
  it('orders users by value, highest first', () => {
    expect(sortByValueDesc(users).map((u) => u.value)).toEqual([30, 20, 10]);
  });

  it('does not mutate the input array', () => {
    const input = [...users];
    sortByValueDesc(input);
    expect(input.map((u) => u.value)).toEqual([10, 30, 20]);
  });
});

describe('totalValue', () => {
  it('sums the value field', () => {
    expect(totalValue(users)).toBe(60);
  });
});
