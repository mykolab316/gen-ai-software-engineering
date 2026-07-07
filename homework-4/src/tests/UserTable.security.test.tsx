import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UserTable } from '../app/components/UserTable';
import type { User } from '../app/lib/transform';

const malicious: User[] = [
  {
    id: 1,
    name: 'Evil',
    status: 'active',
    value: 1,
    description: 'hi<script>window.__xss=1</script><img src=x onerror="window.__xss=1">',
  },
];

describe('UserTable XSS safety', () => {
  it('does not emit raw <script> tags from untrusted description data', () => {
    const { container } = render(<UserTable users={malicious} />);
    expect(container.innerHTML.toLowerCase()).not.toContain('<script');
  });

  it('strips inline event handlers such as onerror', () => {
    const { container } = render(<UserTable users={malicious} />);
    expect(container.innerHTML.toLowerCase()).not.toContain('onerror');
  });

  it('still renders the benign text portion of the description', () => {
    const { getByText } = render(<UserTable users={malicious} />);
    expect(getByText(/hi/)).toBeInTheDocument();
  });
});
