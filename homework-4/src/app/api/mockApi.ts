import type { User } from '../lib/transform';

// Fake API dataset. Note two records carry HTML in `description` that is
// attacker-controlled in the real world (free-text field). This is the
// payload the seeded XSS vulnerability exposes when rendered unsanitized.
const USERS: User[] = [
  { id: 1, name: 'Alice', status: 'active', value: 120, description: 'Top contributor' },
  { id: 2, name: 'Bob', status: 'inactive', value: 80, description: 'On leave' },
  {
    id: 3,
    name: 'Carol',
    status: 'active',
    value: 200,
    description: 'Team lead <img src=x onerror="window.__xss=1">',
  },
  {
    id: 4,
    name: 'Dan',
    status: 'active',
    value: 50,
    description: 'New hire <script>window.__xss=1</script>',
  },
];

/** Simulate a network fetch of the user list. */
export function fetchUsers(): Promise<User[]> {
  return new Promise((resolve) => setTimeout(() => resolve([...USERS]), 150));
}
