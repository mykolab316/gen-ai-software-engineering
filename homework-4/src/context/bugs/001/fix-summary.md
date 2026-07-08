# Fix Summary — Bug 001

## Overview
Applied all three changes from the implementation plan to fix inverted filter logic, reversed sort order, and XSS vulnerability in UserTable component.

---

## Changes Made

### Change 1: Fix inverted status filter in `app/lib/transform.ts`
- **Location**: `filterByStatus` function, line with `.filter` predicate
- **Before**: `return users.filter((u) => u.status !== status);`
- **After**: `return users.filter((u) => u.status === status);`
- **Rationale**: The `!==` operator was inverting the filter logic, returning all users that do NOT match the requested status. Changed to `===` to correctly return users whose status matches the filter parameter.
- **Effect**: `filterByStatus` tests now pass; filtering by status correctly returns matching users.

### Change 2: Fix reversed sort comparator in `app/lib/transform.ts`
- **Location**: `sortByValueDesc` function, line with `.sort` comparator
- **Before**: `return [...users].sort((a, b) => a.value - b.value);`
- **After**: `return [...users].sort((a, b) => b.value - a.value);`
- **Rationale**: The comparator `a.value - b.value` produces ascending order (lowest value first). Reversed to `b.value - a.value` to achieve descending order (highest value first) as intended by the function name. The spread operator `[...users]` was already present, preventing mutation of the input array.
- **Effect**: `sortByValueDesc` tests now pass; users are sorted by value in descending order.

### Change 3: Sanitize description with DOMPurify in `app/components/UserTable.tsx`
- **Location**: Top-of-file imports + the description `<td>` render
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
- **Rationale**: The `description` field comes from untrusted API data (free-text user input) and was being injected directly via `dangerouslySetInnerHTML` with no sanitization. This allows XSS attacks via injected `<script>` tags or event handlers like `onerror`. DOMPurify.sanitize removes dangerous markup while preserving benign text and safe HTML tags.
- **Effect**: XSS-safety tests pass; malicious scripts and event handlers are stripped; benign markup is preserved.

---

## Overall Status

**Expected Outcome**: All three fixes have been applied exactly as specified in the implementation plan. The codebase should now pass all 8 tests:
- 2 tests for `filterByStatus` (logic fix)
- 2 tests for `sortByValueDesc` (comparator fix)
- 3 tests for `UserTable` XSS safety (sanitization added)
- 1 control test for `totalValue` (unchanged, should remain green)

---

## Manual Verification

To verify the fixes work correctly:

1. **Filter logic**: Call `filterByStatus([{id:1, name:'Alice', status:'active', value:100, description:'test'}], 'active')` and confirm it returns the user (previously would return empty array).

2. **Sort order**: Call `sortByValueDesc([{..., value:10}, {..., value:50}, {..., value:30}])` and confirm output is ordered [50, 30, 10] by value (previously would be [10, 30, 50]).

3. **XSS safety**: Pass a description containing `<script>alert('xss')</script>` or `<img onerror="alert('xss')">` to UserTable. Confirm in rendered HTML that:
   - The `<script>` tag is completely removed
   - Event handlers like `onerror` are stripped
   - Benign text (e.g., `<b>bold text</b>`) is preserved as safe markup

---

## References
- Implementation Plan: `context/bugs/001/implementation-plan.md`
- Files modified: `app/lib/transform.ts`, `app/components/UserTable.tsx`
- DOMPurify: Trusted HTML sanitizer library (already available in project dependencies)


## Full test suite (recorded by pipeline)

Command: `npm test`

```
> homework-4-agent-pipeline@1.0.0 test
> vitest run


 RUN  v2.1.9 /Users/admin/gen-ai-homeworks/gen-ai-software-engineering/homework-4/src

 ✓ tests/transform.test.ts (5 tests) 4ms
 ✓ tests/UserTable.security.test.tsx (3 tests) 52ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  14:59:25
   Duration  1.52s (transform 72ms, setup 274ms, collect 162ms, tests 56ms, environment 1.48s, prepare 217ms)
```

Result: PASS
