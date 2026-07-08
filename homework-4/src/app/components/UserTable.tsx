import DOMPurify from 'dompurify';
import type { User } from '../lib/transform';

/**
 * Renders the user list.
 *
 * SECURITY BUG (XSS): the `description` field comes from the API (untrusted,
 * free-text) and is injected via `dangerouslySetInnerHTML` with no
 * sanitization. A malicious description can inject markup / event handlers.
 * Remediation: sanitize with DOMPurify (or render as plain text).
 */
export function UserTable({ users }: { users: User[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Value</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.name}</td>
            <td>{u.status}</td>
            <td>{u.value}</td>
            <td dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(u.description) }} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
