# Gauss Skills Hub Community Catalogue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the catalogue into a searchable compact list and add skill-level comments plus upvote/downvote interactions without introducing accounts.

**Architecture:** Extend `Skill` with vote aggregates, add dedicated `SkillComment` and `SkillVote` tables, and keep all new interactions attached to the skill rather than individual versions. Reuse the existing Next.js app-router structure, Prisma data layer, and server actions so catalogue search, ranking, comments, and vote toggling remain server-driven and easy to verify.

**Tech Stack:** Next.js 14 app router, React server/client components, Prisma, PostgreSQL, Vitest, Playwright

---

### Task 1: Extend the Prisma schema for community interactions

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `src/test/domain/community-model.test.ts`

**Step 1: Write the failing test**

Create `src/test/domain/community-model.test.ts` with assertions for the new shape:

- `Skill` supports `totalUpvoteCount` and `totalDownvoteCount`
- `SkillComment` requires `skillId`, `authorName`, and `content`
- `SkillVote` enforces one `(skillId, browserTokenHash)` row and a vote enum of `up` or `down`

Use a schema-level smoke approach by importing Prisma-generated enums or by asserting helper types that depend on the generated client once the schema is updated.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/community-model.test.ts`

Expected: FAIL because the Prisma client and schema do not yet contain the new fields and models.

**Step 3: Write minimal implementation**

Update `prisma/schema.prisma`:

- add `totalUpvoteCount Int @default(0)` to `Skill`
- add `totalDownvoteCount Int @default(0)` to `Skill`
- add `enum SkillVoteValue { up down }`
- add model `SkillComment`
- add model `SkillVote`
- add the required relations from `Skill`

Recommended structure:

```prisma
enum SkillVoteValue {
  up
  down
}

model SkillComment {
  id         String   @id @default(cuid())
  skillId     String
  authorName  String
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@index([skillId, createdAt])
}

model SkillVote {
  id               String         @id @default(cuid())
  skillId           String
  browserTokenHash  String
  value             SkillVoteValue
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  skill             Skill         @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([skillId, browserTokenHash])
  @@index([skillId, value])
}
```

Also change `SkillVersion.submitterName` from optional to required if the current DB migration path allows it cleanly. If not, keep the field nullable in schema for compatibility and enforce required input at validation/UI level in later tasks.

**Step 4: Run test to verify it passes**

Run:

- `npm test -- src/test/domain/community-model.test.ts`
- `set -a && source .env.local && npx prisma generate && npx prisma db push`

Expected: test passes and Prisma updates the local schema successfully.

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/test/domain/community-model.test.ts
git commit -m "feat: add community interaction schema"
```

### Task 2: Add validation and service logic for required names, comments, and votes

**Files:**
- Modify: `src/lib/skills/validation.ts`
- Modify: `src/lib/skills/types.ts`
- Create: `src/lib/skills/community.ts`
- Test: `src/test/domain/submission-validation.test.ts`
- Test: `src/test/domain/community-actions.test.ts`

**Step 1: Write the failing tests**

Add or extend tests to prove:

- submission fails when `submitterName` is blank
- comment validation fails when `authorName` or `content` is blank
- vote service toggles from neutral -> up, up -> neutral, up -> down, down -> neutral
- aggregate counters update correctly when switching vote direction

`src/test/domain/community-actions.test.ts` should use pure helper functions for vote transitions so the rules can be validated without the database first.

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/domain/submission-validation.test.ts`
- `npm test -- src/test/domain/community-actions.test.ts`

Expected: FAIL because submitter name is not yet mandatory and community helpers do not exist.

**Step 3: Write minimal implementation**

In `src/lib/skills/validation.ts`:

- make `submitterName` required and trimmed
- add `commentSchema`
- add `voteDirectionSchema`

In `src/lib/skills/community.ts`:

- add a helper that translates current vote + requested vote into:
  - new stored vote value or deletion
  - aggregate upvote delta
  - aggregate downvote delta

Example shape:

```ts
export function resolveVoteTransition(current: "up" | "down" | null, requested: "up" | "down") {
  if (current === requested) {
    return { next: null, upDelta: requested === "up" ? -1 : 0, downDelta: requested === "down" ? -1 : 0 };
  }

  if (!current) {
    return { next: requested, upDelta: requested === "up" ? 1 : 0, downDelta: requested === "down" ? 1 : 0 };
  }

  return {
    next: requested,
    upDelta: requested === "up" ? 1 : -1,
    downDelta: requested === "down" ? 1 : -1
  };
}
```

Update any exported app types in `src/lib/skills/types.ts` so later query and component work has clear type support.

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/domain/submission-validation.test.ts`
- `npm test -- src/test/domain/community-actions.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/skills/validation.ts src/lib/skills/types.ts src/lib/skills/community.ts src/test/domain/submission-validation.test.ts src/test/domain/community-actions.test.ts
git commit -m "feat: add community validation rules"
```

### Task 3: Extend queries and server actions for search, list ranking, comments, and votes

**Files:**
- Modify: `src/lib/skills/queries.ts`
- Modify: `src/app/actions/submissions.ts`
- Create: `src/app/actions/community.ts`
- Create: `src/lib/skills/browser-token.ts`
- Test: `src/test/domain/community-query-sorting.test.ts`
- Test: `src/test/domain/community-server-actions.test.ts`

**Step 1: Write the failing tests**

Add query-level tests that prove:

- `/skills` default sort is `upvotes`
- sorting by `downvotes` is supported
- search matches title, summary, slug, and submitter name
- detail query returns:
  - skill upvote/downvote totals
  - selected version submitter name with `未署名` fallback
  - comments newest first
  - current browser vote when a token is present

Add action tests that prove:

- comment creation requires valid `commentSchema`
- vote action uses browser token, upserts or deletes `SkillVote`, and updates `Skill` aggregates correctly

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/domain/community-query-sorting.test.ts`
- `npm test -- src/test/domain/community-server-actions.test.ts`

Expected: FAIL because neither the query layer nor the new actions exist.

**Step 3: Write minimal implementation**

In `src/lib/skills/queries.ts`:

- extend `SkillSort` to include `upvotes` and `downvotes`
- change catalogue default later to `upvotes`
- include `totalUpvoteCount`, `totalDownvoteCount`, and current version `submitterName` in `SkillCardRecord`
- update search filters to include current version submitter name
- extend detail queries to include comments and vote totals

In `src/app/actions/submissions.ts`:

- enforce required `submitterName`
- keep all other public release behavior intact

In `src/lib/skills/browser-token.ts`:

- create a helper to read or create a cookie token
- create a helper to hash the token for DB storage

In `src/app/actions/community.ts`:

- implement `submitSkillComment(formData)`
- implement `toggleSkillVote(formData)`
- after mutations, `revalidatePath("/skills")` and `revalidatePath(`/skills/${slug}`)`

Keep the action code small and database-driven. Reuse the pure vote-transition helper from Task 2.

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/domain/community-query-sorting.test.ts`
- `npm test -- src/test/domain/community-server-actions.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/skills/queries.ts src/app/actions/submissions.ts src/app/actions/community.ts src/lib/skills/browser-token.ts src/test/domain/community-query-sorting.test.ts src/test/domain/community-server-actions.test.ts
git commit -m "feat: add community queries and actions"
```

### Task 4: Redesign the `/skills` catalogue into a compact searchable list

**Files:**
- Modify: `src/app/skills/page.tsx`
- Modify: `src/components/skills/catalogue-sort-bar.tsx`
- Replace: `src/components/skills/skill-card.tsx`
- Create: `src/components/skills/catalogue-search-form.tsx`
- Test: `src/test/ui/skills-page.test.tsx`
- Test: `src/test/ui/catalogue-sort-bar.test.tsx`

**Step 1: Write the failing tests**

Add UI tests that prove:

- the catalogue renders a list-style layout instead of large cover cards
- the page includes a search field and submit button
- sort controls include `按点赞排序` and `按点踩排序`
- sorting links preserve the current search query
- the empty state changes when a search query has no results

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/ui/skills-page.test.tsx`
- `npm test -- src/test/ui/catalogue-sort-bar.test.tsx`

Expected: FAIL because the current page still uses grid cards and no search form exists.

**Step 3: Write minimal implementation**

In `src/app/skills/page.tsx`:

- change default sort resolver to `upvotes`
- pass the current search query and result state to the UI
- render a list container instead of the current grid

In `src/components/skills/catalogue-search-form.tsx`:

- add a GET form targeting `/skills`
- include an input named `q`
- preserve the current `sort` in a hidden input

In `src/components/skills/catalogue-sort-bar.tsx`:

- add `upvotes` and `downvotes`
- preserve `q`

In `src/components/skills/skill-card.tsx`:

- turn the component into a compact row item
- remove the large cover block from catalogue layout
- show title, summary, version, submitter name, upvotes, downvotes, downloads, and updated time

Do not reintroduce a dense card gallery under a new class name. The page goal is directory scanning, not visual storytelling.

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/ui/skills-page.test.tsx`
- `npm test -- src/test/ui/catalogue-sort-bar.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/skills/page.tsx src/components/skills/catalogue-sort-bar.tsx src/components/skills/catalogue-search-form.tsx src/components/skills/skill-card.tsx src/test/ui/skills-page.test.tsx src/test/ui/catalogue-sort-bar.test.tsx
git commit -m "feat: redesign catalogue as searchable list"
```

### Task 5: Add vote actions and community metrics to the skill detail page

**Files:**
- Modify: `src/app/skills/[slug]/page.tsx`
- Create: `src/components/skills/skill-vote-panel.tsx`
- Test: `src/test/ui/skill-detail-page.test.tsx`
- Test: `src/test/ui/skill-vote-panel.test.tsx`

**Step 1: Write the failing tests**

Add UI assertions for:

- total upvotes and downvotes are rendered on the detail page
- selected-version submitter name is rendered
- the page includes `点赞` and `点踩` actions
- the vote panel reflects the current selected state when a browser vote exists

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/ui/skill-detail-page.test.tsx`
- `npm test -- src/test/ui/skill-vote-panel.test.tsx`

Expected: FAIL because the detail page currently lacks vote UI and submitter display.

**Step 3: Write minimal implementation**

In `src/components/skills/skill-vote-panel.tsx`:

- render two buttons wired to `toggleSkillVote`
- include hidden inputs for `skillId`, `slug`, and desired direction
- style the selected button differently from the neutral one

In `src/app/skills/[slug]/page.tsx`:

- render submitter name for the selected version
- render total upvotes and downvotes near existing metrics
- place the vote panel near primary actions without crowding download/version controls

Keep `更新说明` and `发布新版本` intact.

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/ui/skill-detail-page.test.tsx`
- `npm test -- src/test/ui/skill-vote-panel.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/skills/[slug]/page.tsx src/components/skills/skill-vote-panel.tsx src/test/ui/skill-detail-page.test.tsx src/test/ui/skill-vote-panel.test.tsx
git commit -m "feat: add skill voting to detail pages"
```

### Task 6: Add append-only comments to the skill detail page

**Files:**
- Create: `src/components/skills/skill-comment-form.tsx`
- Create: `src/components/skills/skill-comment-list.tsx`
- Modify: `src/app/skills/[slug]/page.tsx`
- Test: `src/test/ui/skill-comment-form.test.tsx`
- Test: `src/test/ui/skill-detail-page.test.tsx`

**Step 1: Write the failing tests**

Add UI coverage for:

- comment form renders `姓名` and `评论内容`
- comments list renders newest comments first
- detail page shows the community discussion section

**Step 2: Run tests to verify they fail**

Run:

- `npm test -- src/test/ui/skill-comment-form.test.tsx`
- `npm test -- src/test/ui/skill-detail-page.test.tsx`

Expected: FAIL because no comment UI exists yet.

**Step 3: Write minimal implementation**

In `src/components/skills/skill-comment-form.tsx`:

- create a small form posting to `submitSkillComment`
- include hidden `skillId` and `slug`

In `src/components/skills/skill-comment-list.tsx`:

- render name, timestamp, and body for each comment

In `src/app/skills/[slug]/page.tsx`:

- insert the community discussion section below the markdown article
- wire in comments returned by the detail query

Keep the comment area visually subordinate to the version content so the page still reads as product documentation first.

**Step 4: Run tests to verify they pass**

Run:

- `npm test -- src/test/ui/skill-comment-form.test.tsx`
- `npm test -- src/test/ui/skill-detail-page.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/skills/skill-comment-form.tsx src/components/skills/skill-comment-list.tsx src/app/skills/[slug]/page.tsx src/test/ui/skill-comment-form.test.tsx src/test/ui/skill-detail-page.test.tsx
git commit -m "feat: add skill comments"
```

### Task 7: Verify public publishing and community flows end to end

**Files:**
- Modify: `tests/e2e/public-release.spec.ts`
- Create: `tests/e2e/community-catalogue.spec.ts`

**Step 1: Write the failing e2e test**

Create `tests/e2e/community-catalogue.spec.ts` covering:

- publish a skill with required name
- open its detail page
- upvote it
- confirm `/skills?sort=upvotes` ranks it correctly
- add a comment with a name
- confirm the comment appears on the detail page
- optionally toggle to downvote and confirm `/skills?sort=downvotes` works

Also update `tests/e2e/public-release.spec.ts` so submissions explicitly fill the required publisher name.

**Step 2: Run tests to verify they fail**

Run:

- `E2E_BASE_URL='http://127.0.0.1:3000' npm run test:e2e -- public-release.spec.ts`
- `E2E_BASE_URL='http://127.0.0.1:3000' npm run test:e2e -- community-catalogue.spec.ts`

Expected: FAIL because the publish form and community interaction flow do not yet match the tests.

**Step 3: Write minimal implementation**

Adjust any remaining UI, actions, or selectors required for the tests:

- ensure publish form requires and submits `姓名`
- ensure vote buttons and comment form have stable labels
- ensure catalogue sorting links and list rows are easy for Playwright to target

Avoid adding test-only production logic. Prefer accessible labels and stable text.

**Step 4: Run tests to verify they pass**

Run:

- `E2E_BASE_URL='http://127.0.0.1:3000' npm run test:e2e -- public-release.spec.ts`
- `E2E_BASE_URL='http://127.0.0.1:3000' npm run test:e2e -- community-catalogue.spec.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/e2e/public-release.spec.ts tests/e2e/community-catalogue.spec.ts
git commit -m "test: cover community catalogue flows"
```

### Task 8: Final verification and cleanup

**Files:**
- Review only unless fixes are needed

**Step 1: Run the full verification suite**

Run:

- `set -a && source .env.local && npx prisma generate && npx prisma db push`
- `npm test`
- `npm run lint`
- `npm run build`
- `E2E_BASE_URL='http://127.0.0.1:3000' npm run test:e2e -- public-release.spec.ts community-catalogue.spec.ts`

Expected:

- Prisma sync succeeds
- all Vitest tests pass
- lint passes cleanly
- build passes
- both Playwright specs pass

**Step 2: Inspect git status**

Run: `git status --short`

Expected: only intended tracked files are modified.

**Step 3: Commit the final integration changes**

```bash
git add prisma/schema.prisma src/app/actions/submissions.ts src/app/actions/community.ts src/lib/skills/validation.ts src/lib/skills/community.ts src/lib/skills/browser-token.ts src/lib/skills/queries.ts src/app/skills/page.tsx src/components/skills/catalogue-search-form.tsx src/components/skills/catalogue-sort-bar.tsx src/components/skills/skill-card.tsx src/app/skills/[slug]/page.tsx src/components/skills/skill-vote-panel.tsx src/components/skills/skill-comment-form.tsx src/components/skills/skill-comment-list.tsx src/test/domain/community-model.test.ts src/test/domain/community-actions.test.ts src/test/domain/community-query-sorting.test.ts src/test/domain/community-server-actions.test.ts src/test/domain/submission-validation.test.ts src/test/ui/skills-page.test.tsx src/test/ui/catalogue-sort-bar.test.tsx src/test/ui/skill-detail-page.test.tsx src/test/ui/skill-vote-panel.test.tsx src/test/ui/skill-comment-form.test.tsx tests/e2e/public-release.spec.ts tests/e2e/community-catalogue.spec.ts
git commit -m "feat: add community catalogue interactions"
```

**Step 4: Request review**

Use `@superpowers:requesting-code-review` before merging.
