import { useEffect, useState } from 'react';
import { fetchUsers } from '../api/mockApi';
import { filterByStatus, sortByValueDesc, totalValue, type User } from '../lib/transform';
import { UserTable } from './UserTable';

export function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  // Show active users, highest value first.
  const active = sortByValueDesc(filterByStatus(users, 'active'));

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Team Dashboard</h1>
      <p>
        Active users: {active.length} · Total value: {totalValue(active)}
      </p>
      <UserTable users={active} />
    </main>
  );
}
