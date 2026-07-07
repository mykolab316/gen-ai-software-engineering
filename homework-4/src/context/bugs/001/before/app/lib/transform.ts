export interface User {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  value: number;
  description: string;
}

/**
 * Return only users whose status matches the requested one.
 * BUG 1 (inverted filter): uses `!==` so it returns the WRONG set
 * (everyone who does NOT match). Should be `===`.
 */
export function filterByStatus(users: User[], status: User['status']): User[] {
  return users.filter((u) => u.status !== status);
}

/**
 * Sort users by `value`, highest first.
 * BUG 2 (reversed comparator): `a.value - b.value` sorts ASCENDING.
 * Should be `b.value - a.value` for descending order.
 */
export function sortByValueDesc(users: User[]): User[] {
  return [...users].sort((a, b) => a.value - b.value);
}

/** Sum the `value` field across users. (Correct — used by the dashboard summary.) */
export function totalValue(users: User[]): number {
  return users.reduce((sum, u) => sum + u.value, 0);
}
