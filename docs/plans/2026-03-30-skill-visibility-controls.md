# Skill Visibility Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add skill-level hide/delete controls for public visitors and admins, then clean the database down to a small intentional demo set.

**Architecture:** Introduce a `Skill.visibility` field and filter all public queries through it. Keep version status semantics unchanged, add explicit server actions for public hide and admin hide/restore/delete, and attach those actions to existing detail and admin review screens with confirmation prompts.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Vitest, Testing Library, Playwright

---

### Task 1: Extend the schema for skill visibility

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `src/test/domain/community-model.test.ts`

**Step 1: Write the failing test**

Extend `src/test/domain/community-model.test.ts` to assert `SkillVisibility` exists and `Skill` exposes a `visibility` field.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/community-model.test.ts`
Expected: FAIL because the generated client does not yet expose the new enum/field.

**Step 3: Write minimal implementation**

- add `enum SkillVisibility { public hidden }`
- add `visibility SkillVisibility @default(public)` to `Skill`

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/domain/community-model.test.ts`
- `set -a && source .env.local && npx prisma generate && npx prisma db push`

Expected: PASS.

### Task 2: Add failing query tests for hidden skills

**Files:**
- Modify: `src/test/domain/community-query-sorting.test.ts`
- Modify: `src/lib/skills/queries.ts`

**Step 1: Write the failing tests**

Add tests proving:

- hidden skills are excluded from `listLatestApprovedSkills`
- hidden skills return `null` from `getSkillDetail`
- admin queries are not filtered by visibility

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/test/domain/community-query-sorting.test.ts`
Expected: FAIL because public queries do not yet check visibility.

**Step 3: Write minimal implementation**

Filter `listLatestApprovedSkills`, `getSkillDetail`, and any public prefill query to `visibility: "public"`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/test/domain/community-query-sorting.test.ts`
Expected: PASS.

### Task 3: Add server-action tests for public hide and admin skill controls

**Files:**
- Modify: `src/test/domain/community-server-actions.test.ts`
- Create: `src/test/domain/skill-visibility-actions.test.ts`
- Modify: `src/app/actions/community.ts`
- Modify: `src/app/actions/admin.ts`
- Modify: `src/lib/storage.ts`

**Step 1: Write the failing tests**

Add domain coverage for:

- public hide action marks the skill hidden and redirects to `/skills?status=hidden`
- admin hide marks hidden and redirects back with `status=hidden`
- admin restore marks public and redirects back with `status=restored`
- admin delete removes the skill and schedules file cleanup

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/domain/community-server-actions.test.ts`
- `npm test -- src/test/domain/skill-visibility-actions.test.ts`

Expected: FAIL because these actions do not exist yet.

**Step 3: Write minimal implementation**

- add public hide action in `src/app/actions/community.ts`
- add admin hide/restore/delete actions in `src/app/actions/admin.ts`
- add helper(s) in `src/lib/storage.ts` for best-effort deletion of multiple stored files

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/domain/community-server-actions.test.ts`
- `npm test -- src/test/domain/skill-visibility-actions.test.ts`

Expected: PASS.

### Task 4: Add public and admin UI controls with confirmation prompts

**Files:**
- Create: `src/components/skills/skill-visibility-actions.tsx`
- Create: `src/components/admin/admin-skill-controls.tsx`
- Modify: `src/app/skills/[slug]/page.tsx`
- Modify: `src/app/admin/versions/[id]/page.tsx`
- Modify: `src/test/ui/skill-detail-page.test.tsx`
- Modify: `src/test/ui/admin-dashboard.test.tsx`
- Create: `src/test/ui/admin-skill-controls.test.tsx`

**Step 1: Write the failing tests**

Add UI coverage for:

- public detail page renders `下架这个 Skill`
- admin review page renders hide/restore/delete buttons based on visibility
- client controls attach confirm prompts before submit

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/ui/skill-detail-page.test.tsx`
- `npm test -- src/test/ui/admin-dashboard.test.tsx`
- `npm test -- src/test/ui/admin-skill-controls.test.tsx`

Expected: FAIL because the controls do not exist yet.

**Step 3: Write minimal implementation**

- render public hide control from the skill detail page
- render admin controls on the admin review page
- use small client components with `window.confirm(...)`

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/ui/skill-detail-page.test.tsx`
- `npm test -- src/test/ui/admin-dashboard.test.tsx`
- `npm test -- src/test/ui/admin-skill-controls.test.tsx`

Expected: PASS.

### Task 5: Cover hide/restore/delete flows end to end

**Files:**
- Modify: `tests/e2e/community-catalogue.spec.ts`
- Create: `tests/e2e/skill-visibility-controls.spec.ts`

**Step 1: Write the failing e2e tests**

Cover:

- publish a public skill
- hide it from the public detail page
- confirm it disappears from `/skills`
- log in as admin
- restore it
- hide again as admin
- delete it as admin
- confirm the skill is gone

**Step 2: Run tests to verify they fail**

Run:

- `E2E_BASE_URL='http://127.0.0.1:3100' npm run test:e2e -- tests/e2e/skill-visibility-controls.spec.ts`

Expected: FAIL because the flows do not yet exist.

**Step 3: Write minimal implementation adjustments**

Make any missing route/UI tweaks needed so the e2e flow passes cleanly.

**Step 4: Run tests to verify they pass**

Run:

- `E2E_BASE_URL='http://127.0.0.1:3100' npm run test:e2e -- tests/e2e/community-catalogue.spec.ts tests/e2e/skill-visibility-controls.spec.ts`

Expected: PASS.

### Task 6: Verify and clean sample data

**Files:**
- Review only unless a helper script is needed

**Step 1: Run the verification suite**

Run:

- `npm test`
- `npm run lint`
- `set -a && source .env.local && npm run build`

Expected: all commands pass.

**Step 2: Clean data**

- remove obvious smoke/e2e skills by slug pattern
- remove their uploaded files under `storage/uploads`
- keep only 1-2 intentional sample skills, preferably `superpowers` plus one optional demo record

**Step 3: Re-check data**

Run a small Prisma query to confirm the remaining skill count and names.

Expected: only 1-2 intended demo skills remain.
