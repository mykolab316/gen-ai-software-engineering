import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UserTable } from '../../app/components/UserTable';
import type { User } from '../../app/lib/transform';

const makeUser = (overrides: Partial<User>): User => ({
  id: 1,
  name: 'Test',
  status: 'active',
  value: 0,
  description: '',
  ...overrides,
});

describe('UserTable XSS sanitization (regression for dangerouslySetInnerHTML vuln)', () => {
  it('strips <script> tags from the description field', () => {
    const users: User[] = [
      makeUser({ id: 1, name: 'Eve', description: '<script>alert("xss")</script>Hello' }),
    ];
    const { container } = render(<UserTable users={users} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('Hello');
  });

  it('strips event handler attributes like onerror', () => {
    const users: User[] = [
      makeUser({ id: 2, name: 'Mallory', description: '<img src="x" onerror="alert(1)">' }),
    ];
    const { container } = render(<UserTable users={users} />);
    const img = container.querySelector('img');
    expect(container.innerHTML).not.toContain('onerror');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
    }
  });

  it('preserves benign, safe markup in the description', () => {
    const users: User[] = [
      makeUser({ id: 3, name: 'Alice', description: '<b>bold text</b>' }),
    ];
    const { container } = render(<UserTable users={users} />);
    const bold = container.querySelector('b');
    expect(bold).not.toBeNull();
    expect(bold?.textContent).toBe('bold text');
  });

  it('renders name, status and value columns correctly for each user', () => {
    const users: User[] = [
      makeUser({ id: 4, name: 'Carol', status: 'inactive', value: 42, description: 'plain text' }),
    ];
    const { getByText } = render(<UserTable users={users} />);
    expect(getByText('Carol')).toBeTruthy();
    expect(getByText('inactive')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
    expect(getByText('plain text')).toBeTruthy();
  });
});
