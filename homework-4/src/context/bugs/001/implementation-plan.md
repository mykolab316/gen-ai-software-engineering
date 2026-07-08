# Implementation Plan — Bug 001

> Produced by the Bug Planner (seeded fixture). Input to the Bug Fixer.

**Test command**: `npm test` (run from `src/`).

---

## Change 1 — Fix inverted status filter
- **File**: `app/lib/transform.ts`
- **Location**: `filterByStatus` (the `.filter` predicate).
- **Before**:
  ```ts
  return users.filter((u) => u.status !== status);
  ```
- **After**:
  ```ts
  return users.filter((u) => u.status === status);
  ```
- **Why**: keep users that match the requested status.

## Change 2 — Fix reversed sort comparator
- **File**: `app/lib/transform.ts`
- **Location**: `sortByValueDesc` (the `.sort` comparator).
- **Before**:
  ```ts
  return [...users].sort((a, b) => a.value - b.value);
  ```
- **After**:
  ```ts
  return [...users].sort((a, b) => b.value - a.value);
  ```
- **Why**: descending order (highest value first). Keep the copy so the input is not mutated.

## Change 3 — Sanitize description to remove XSS
- **File**: `app/components/UserTable.tsx`
- **Location**: top-of-file import + the description `<td>`.
- **Before**:
  ```tsx
  import type { User } from '../lib/transform';
  ...
  <td dangerouslySetInnerHTML={{ __html: u.description }} />
  ```
- **After**:
  ```tsx
  import DOMPurify from 'dompurify';
  import type { User } from '../lib/transform';
  ...
  <td dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(u.description) }} />
  ```
- **Why**: `DOMPurify.sanitize` strips `<script>` tags and inline event handlers
  (e.g. `onerror`) from the untrusted API string while preserving benign text/markup.

---

## Expected result after applying all changes
- `filterByStatus` / `sortByValueDesc` tests pass.
- `UserTable` XSS-safety tests pass (no `<script`, no `onerror` in output; benign text kept).
- Previously-passing control tests remain green. Full suite: **8 passing**.
