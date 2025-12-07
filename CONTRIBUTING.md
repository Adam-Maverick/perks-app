# Contributing to Perks App

## Development Standards

### 🧪 Testing Guidelines

#### 1. Vitest Globals (CRITICAL)
**Do NOT import Vitest primitives explicitly.**
The project uses `globals: true` in `vitest.config.ts`. Explicit imports conflict with Next.js Server Action transformations and cause "No test suite found" errors.

**❌ Incorrect:**
```typescript
import { describe, it, expect } from 'vitest'; // DO NOT DO THIS
```

**✅ Correct:**
```typescript
// No imports needed - describe, it, expect, vi, beforeEach are global
describe('MyComponent', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

#### 2. Test Data
- Use valid UUIDs/CUIDs for IDs (e.g., `user_123`, `org_789`) to satisfy Zod schemas.
- Do not use empty strings or simple numbers for string IDs.

### 🔒 Security Patterns

#### Server Actions
Every Server Action must:
1.  Verify authentication using `auth()`.
2.  Validate that the `userId` in the payload matches the authenticated `requesterId` (prevent IDOR).

```typescript
const { userId: requesterId } = auth();
if (!requesterId) throw new Error("Unauthorized");
if (input.userId !== requesterId) throw new Error("Unauthorized access");
```

### 📄 PDF Generation
- Always register the **Roboto** font to correctly render the Nigerian Naira (₦) symbol.
- Use `RenderRentReceiptPdf` or similar utilities that handle this standard.
