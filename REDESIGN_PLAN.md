# School ID Extractor - Complete Redesign & Fix Plan

**Generated:** 2025-08-18  
**Status:** Phase-based implementation plan  
**Priority:** Critical fixes first, then enhancements

---

## 📋 Executive Summary

The codebase is a well-architected Next.js 16 application with solid foundations but has **critical runtime failures** (missing `'use client'` directives), **security gaps** (unprotected API routes), **broken auth flow** (removed admin roles but JWT still expects them), and **TypeScript errors** preventing builds.

---

## 🎯 Phase 1: Critical Runtime Fixes (DO FIRST - Blocks Everything)

### 1.1 Add `'use client'` to Client Components
| File | Issue | Fix |
|------|-------|-----|
| `src/app/page.tsx` | Uses `useSession`, `useRouter`, `useState`, `useEffect`, `useRef`, `useCallback` but no `'use client'` | Add `"use client";` at line 1 |

**Impact:** Without this, the landing page crashes with "hooks can only be used in client components"

### 1.2 Fix Auth JWT/Session Role System
**File:** `src/lib/auth.ts`

**Current Issue:** Removed admin logic but JWT callbacks still reference `token.role` and `getRoleBadge` expects it.

**Fix:** Update JWT and session callbacks:
```typescript
// In jwt callback:
if (user) {
  token.role = "USER"; // Default all users to USER
  token.email = user.email;
  token.name = user.name;
  token.image = user.image;
}

// In session callback:
if (session.user) {
  session.user.role = token.role as string; // Will be "USER"
  session.user.email = token.email as string;
  session.user.name = token.name as string;
  session.user.image = token.image as string;
}
```

**Impact:** Navbar role badge, `getRoleBadge` utility will work correctly.

---

## 🔒 Phase 2: Security - API Route Protection (CRITICAL)

### 2.1 Unprotected API Routes (Expose All Data)
| Route | Current State | Required |
|-------|---------------|----------|
| `src/app/api/sections/route.ts` | No auth | Add `requireAuth()` |
| `src/app/api/students/route.ts` | No auth | Add `requireAuth()` |
| `src/app/api/students/search/route.ts` | No auth | Add `requireAuth()` |
| `src/app/api/schools/route.ts` | GET unprotected | Add `requireAuth()` to GET |

**Fix Pattern:** Use existing `src/lib/auth-guard.ts`
```typescript
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth();
  if (authCheck.error) return authCheck;
  // ... rest of handler
}
```

### 2.2 Auth Guard Cleanup
**File:** `src/lib/auth-guard.ts`
- Remove `requireAdmin` (no admin role exists)
- Keep `requireAuth` only

---

## 🔧 Phase 3: TypeScript/Build Errors (Blocks CI/CD)

### 3.1 DataTable.tsx - Remove `isAdmin` References
**File:** `src/components/DataTable.tsx`

**Errors:**
```
Cannot find name 'isAdmin' (lines 207, 216, 247, 258)
```

**Fixes:**
| Line | Current | Fix |
|------|---------|-----|
| 207 | `{isAdmin && (` | Remove condition, always render |
| 216 | `${isAdmin ? '' : 'pl-3'}` | Replace with `'pl-3'` |
| 247 | `{isAdmin && (` | Remove condition, always render |
| 256 | `${isAdmin ? '' : 'pl-3'}` | Replace with `'pl-3'` |

### 3.2 GlobalSearch.tsx - Duplicate Import & Missing Icons
**File:** `src/components/GlobalSearch.tsx`
- Line 4: `Loader2` imported twice (`Loader2 as LoaderIcon`)
- Missing: `Edit`, `X`, `Check` imports from `lucide-react`

### 3.3 ImportStudentsModal.tsx - Wrong Arrow Import
```typescript
// Change:
import { ArrowRight } from "lucide-react";
// To:
import { ArrowRight } from "lucide-react"; // Already correct, check usage
```

### 3.4 Schools Page - Missing ArrowUpCircle Import
```typescript
// Add to imports in src/app/schools/page.tsx
import { ArrowUpCircle } from "lucide-react";
```

---

## 🎨 Phase 4: UI/UX Polish & Cleanup

### 4.1 Navbar Cleanup (Both Files)
| File | Changes |
|------|---------|
| `src/components/Navbar.tsx` | Remove `getRoleBadge` import, remove `role`/`isAdmin` logic, remove admin badge from user menu |
| `src/components/landing/Navbar.tsx` | Same cleanup, remove `getRoleBadge` import |

### 4.2 Component Imports Cleanup
| Component | Issue | Fix |
|-----------|-------|-----|
| `SchoolManager` | `Settings2` unused | Keep (used in button) |
| `ImportStudentsModal` | `ArrowRight` used but check import | Verify import |
| `PromoteModal` | `ArrowUpCircle` missing import | Add `ArrowUpCircle` to imports |
| `SchoolManager` | `canManageSchools` removed | Remove import |
| `DataTable` | `canDeleteStudents` removed | Remove import |
| `Toolbar` | `canDeleteStudents` removed | Remove import |

### 4.3 GlobalSearch Enhancements (Already Implemented)
- ✅ Edit modal with pencil icon
- ✅ Date format conversion (DD-MM-YYYY → YYYY-MM-DD)
- ✅ Confirm before saving
- ✅ Removed external link button

### 4.4 Auth Error Page
**File:** `src/app/(auth)/auth/error/page.tsx`
- Redirects to landing with error param instead of showing error page

### 4.5 404 Page (New)
**File:** `src/app/not-found.tsx` (Created)
- Friendly 404 with "Go home" and "Try Quick Export" links

---

## 🗄️ Phase 5: Architecture & Developer Experience

### 5.1 API Validation with Zod
**New Files Needed:**
- `src/lib/validators/students.ts` - Student create/update schemas
- `src/lib/validators/schools.ts` - School create/update schemas
- `src/lib/api-handler.ts` - Standardized API response wrapper

### 5.2 Rate Limiting - Move to Redis
**Current:** In-memory Map (resets on deploy)
**Fix:** Use Upstash Redis or Vercel KV

### 5.3 Database Query Helpers
**New File:** `src/lib/db-helpers.ts`
- Prepared statement helpers
- Transaction wrapper
- Type-safe query builders

### 5.4 Testing Setup
```json
// package.json additions
"devDependencies": {
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@playwright/test": "^1.40.0",
  "jsdom": "^23.0.0"
}
```

### 5.5 Documentation
- `.env.example` with all required vars
- `README.md` with setup/deploy instructions
- `CONTRIBUTING.md` for team workflow

---

## 📦 Phase 6: Dependency & Config Cleanup

### 6.1 Keep react-icons
```json
// package.json - KEEP (user confirmed needed)
"react-icons": "^5.7.0",  // Used for GitHub/X icons
```

### 6.2 ESLint/Prettier Config
```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 6.3 Environment Template
```bash
# .env.example
GEMINI_API_KEY=
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=
ADMIN_EMAIL_1=
ADMIN_EMAIL_2=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## 📅 Implementation Timeline

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| 1: Critical Fixes | 1-2 hours | 🔴 Immediate | None |
| 2: Security | 2-3 hours | 🔴 Immediate | Phase 1 |
| 3: TypeScript Fixes | 1-2 hours | 🟠 High | Phase 1 |
| 4: UI Polish | 2-3 hours | 🟡 Medium | Phase 3 |
| 5: Architecture | 4-6 hours | 🟢 Low | Phase 2 |
| 6: Config/Deps | 1 hour | 🟢 Low | Independent |

**Total Estimate:** 11-17 hours

---

## ✅ Verification Checklist

### Phase 1 Complete When:
- [ ] `npm run dev` loads landing page without crash
- [ ] Navbar shows user name (no error)
- [ ] Sign in works via modal

### Phase 2 Complete When:
- [ ] `curl /api/sections` returns 401 without auth
- [ ] `curl /api/students` returns 401 without auth
- [ ] Authenticated requests work

### Phase 3 Complete When:
- [ ] `npx tsc --noEmit` passes (0 errors)
- [ ] `npm run build` succeeds

### Phase 4 Complete When:
- [ ] No unused imports in any file
- [ ] All icons render correctly
- [ ] Navbar consistent across all pages

### Phase 5/6 Complete When:
- [ ] Zod validation on all API routes
- [ ] Redis rate limiting configured
- [ ] Tests passing (`npm test`)
- [ ] Docs updated

---

## 🚀 Quick Start Commands

```bash
# 1. Fix critical issues
cd D:\project\school-id-extractor

# 2. Run type check
npx tsc --noEmit

# 3. Build
npm run build

# 4. Dev server
npm run dev

# 5. After fixes, run tests
npm test

# 6. Lint
npm run lint
```

---

## 📝 Notes

- **Keep `react-icons`** - User confirmed needed for GitHub/X icons
- **Satoshi font** - Requires local file at `/public/fonts/Satoshi-Variable.woff2` or falls back to Inter Tight
- **Sentry** - Already configured, just needs user context enrichment
- **Turso/LibSQL** - Connection pooling configured, verify migrations run in CI

---

*This document should be updated as phases are completed. Check off items as done.*