# Gauss Skills Hub Public Release Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the current moderation-first MVP into a Chinese-first public release platform where every submission becomes visible immediately, existing skills can spawn new versions from public pages, and the catalogue can rank skills by downloads or time.

**Architecture:** Keep the existing Next.js App Router monolith and Prisma models, but change the publishing semantics instead of rebuilding the app. Reuse `Skill` and `SkillVersion`, keep the current admin routes as a maintenance surface, add additive download counters, and route all public mutations through the current server-action and route-handler structure.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Zod, react-markdown, Vitest, Testing Library, Playwright

---

## Prerequisites

- Run from the existing repository root: `/home/yxfish13/agentcoder/GaussSkillsCodex`
- Ensure `.env.local` contains a working `DATABASE_URL`
- Keep the existing admin credentials in env for maintenance access, but do not treat admin review as part of the public release flow

## Scope Notes

- Do not rename `latestApprovedVersionId` in this pass; reuse it as the compatibility pointer to the latest public version
- Do not delete admin routes in this pass
- Do not add a user account system
- Do not allow in-place mutation of existing public versions

### Task 1: Extend the schema and domain helpers for public release metrics

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/skills/types.ts`
- Modify: `src/test/domain/version-status.test.ts`

**Step 1: Write the failing test**

```ts
import { archivePreviousStatus, isPublicSkillVersionStatus } from "@/lib/skills/types";

test("approved and archived versions are public", () => {
  expect(isPublicSkillVersionStatus("approved")).toBe(true);
  expect(isPublicSkillVersionStatus("archived")).toBe(true);
});

test("approving a new public version archives the previous one", () => {
  expect(archivePreviousStatus("approved")).toBe("archived");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/version-status.test.ts`
Expected: FAIL if the helper coverage is incomplete for the new public-release semantics.

**Step 3: Write minimal implementation**

- Add `totalDownloadCount Int @default(0)` to `Skill`
- Add `downloadCount Int @default(0)` to `SkillVersion`
- Keep the existing enum, but set `SkillVersion.status` default to `approved`
- Ensure `src/lib/skills/types.ts` exposes helpers that treat `approved` and `archived` as public statuses

```prisma
model Skill {
  id                 String @id @default(cuid())
  slug               String @unique
  totalDownloadCount Int    @default(0)
}

model SkillVersion {
  id            String             @id @default(cuid())
  downloadCount Int                @default(0)
  status        SkillVersionStatus @default(approved)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/version-status.test.ts`
Expected: PASS

**Step 5: Update Prisma client and database**

Run: `npx prisma generate && npx prisma db push`
Expected: Prisma client regenerates and the additive columns appear in the database.

**Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/skills/types.ts src/test/domain/version-status.test.ts
git commit -m "feat: add public release counters and status defaults"
```

### Task 2: Change submission flow from review-gated to immediate public release

**Files:**
- Modify: `src/app/actions/submissions.ts`
- Modify: `src/lib/skills/service.ts`
- Modify: `src/lib/skills/validation.ts`
- Modify: `src/test/domain/submission-validation.test.ts`
- Create: `src/test/domain/public-release-actions.test.ts`

**Step 1: Write the failing tests**

```ts
import { publishSkillVersion } from "@/lib/skills/service";

test("publishing a new version archives the previous latest version", async () => {
  const result = await publishSkillVersion({
    skillId: "skill-1",
    versionId: "version-2",
    previousLatestVersionId: "version-1"
  });

  expect(result.archivePrevious).toBe(true);
});

test("documentation mode can reuse the previous bundle path", () => {
  const result = submissionSchema.safeParse({
    title: "Gauss",
    slug: "gauss",
    version: "v1.0.1",
    summary: "Long enough summary for validation.",
    markdownContent: "# Gauss\n\nLong enough markdown body for validation.",
    mode: "docs",
    bundleMimeType: "",
    existingBundlePath: "bundles/demo.zip",
    coverMimeType: "image/png"
  });

  expect(result.success).toBe(true);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/test/domain/public-release-actions.test.ts src/test/domain/submission-validation.test.ts`
Expected: FAIL because the current submission flow still assumes admin review and always requires a new bundle.

**Step 3: Write minimal implementation**

- Add a `publishSkillVersion` service that:
  - archives the previous latest public version
  - marks the new version as `approved`
  - updates `Skill.latestApprovedVersionId`
- Update submission validation to accept:
  - `mode: "new" | "docs" | "release"`
  - optional `existingBundlePath` for docs mode
- Update `submitSkillVersion` to:
  - create or find the `Skill`
  - optionally reuse the prior bundle when docs mode has no new archive
  - redirect to `/skills/[slug]?version=<new-version>` instead of `/submit?status=success`

```ts
const status: SkillVersionStatus = "approved";

if (!bundleFile && parsed.data.mode === "docs" && parsed.data.existingBundlePath) {
  savedBundlePath = parsed.data.existingBundlePath;
}

redirect(`/skills/${parsed.data.slug}?version=${encodeURIComponent(parsed.data.version)}`);
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/test/domain/public-release-actions.test.ts src/test/domain/submission-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/actions/submissions.ts src/lib/skills/service.ts src/lib/skills/validation.ts src/test/domain/submission-validation.test.ts src/test/domain/public-release-actions.test.ts
git commit -m "feat: publish submitted versions immediately"
```

### Task 3: Add prefilled public submission modes for updating docs and releasing new versions

**Files:**
- Modify: `src/app/submit/page.tsx`
- Modify: `src/components/forms/skill-submission-form.tsx`
- Modify: `src/lib/skills/queries.ts`
- Modify: `src/test/ui/submission-form.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { SkillSubmissionForm } from "@/components/forms/skill-submission-form";

test("docs mode preloads Chinese guidance and base version metadata", () => {
  render(
    <SkillSubmissionForm
      mode="docs"
      prefill={{
        slug: "superpowers",
        version: "v1.0.0",
        title: "Superpowers",
        summary: "A summary long enough for the test.",
        markdownContent: "# Superpowers\n\nBody content for the test.",
        existingBundlePath: "bundles/superpowers.zip"
      }}
    />,
  );

  expect(screen.getByDisplayValue("superpowers")).toBeInTheDocument();
  expect(screen.getByText(/你正在基于 v1.0.0 更新说明/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/submission-form.test.tsx`
Expected: FAIL because the form currently has no public prefill mode.

**Step 3: Write minimal implementation**

- Teach `src/app/submit/page.tsx` to read `from`, `base`, and `mode` from `searchParams`
- Add a query helper in `src/lib/skills/queries.ts` that loads a public base version for prefilling
- Update `SkillSubmissionForm` to:
  - render Chinese labels and notices
  - accept `mode` and `prefill`
  - include hidden fields like `existingBundlePath`
  - prefill title, summary, markdown, slug, and base version metadata

```tsx
{mode === "docs" ? (
  <p className="text-sm text-muted">你正在基于 {prefill.version} 更新说明，发布后会生成一个新版本。</p>
) : null}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/submission-form.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/submit/page.tsx src/components/forms/skill-submission-form.tsx src/lib/skills/queries.ts src/test/ui/submission-form.test.tsx
git commit -m "feat: add prefilled public submission modes"
```

### Task 4: Rebrand the public shell and localize the site to Chinese

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/site-header.tsx`
- Modify: `src/components/layout/site-footer.tsx`
- Modify: `src/components/ui/section-heading.tsx`
- Modify: `src/test/smoke/home-page.test.tsx`
- Modify: `src/test/ui/site-shell.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

test("home page shows the Gauss Skills Hub brand in Chinese context", () => {
  render(<HomePage />);

  expect(screen.getByText(/gauss skills hub/i)).toBeInTheDocument();
  expect(screen.getByText(/发现、提交和迭代你的 skills/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/test/smoke/home-page.test.tsx src/test/ui/site-shell.test.tsx`
Expected: FAIL because the current shell still uses English review-oriented copy.

**Step 3: Write minimal implementation**

- Reword header navigation to Chinese
- Remove admin language from the primary navigation emphasis
- Update the landing page hero to present `Gauss Skills Hub` as an open release platform
- Keep the existing visual language, but swap the text from review/archive framing to public-release framing

```tsx
const navItems = [
  { href: "/skills", label: "技能广场" },
  { href: "/submit", label: "提交 Skill" },
  { href: "/admin/login", label: "后台维护" }
];
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/test/smoke/home-page.test.tsx src/test/ui/site-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/layout/site-header.tsx src/components/layout/site-footer.tsx src/components/ui/section-heading.tsx src/test/smoke/home-page.test.tsx src/test/ui/site-shell.test.tsx
git commit -m "feat: rebrand public shell for gauss skills hub"
```

### Task 5: Add catalogue sorting and richer skill metadata cards

**Files:**
- Modify: `src/app/skills/page.tsx`
- Modify: `src/components/skills/skill-card.tsx`
- Modify: `src/lib/skills/queries.ts`
- Create: `src/components/skills/catalogue-sort-bar.tsx`
- Create: `src/test/ui/skills-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import SkillsPage from "@/app/skills/page";

test("skills page exposes download, update, and created sort controls", async () => {
  render(await SkillsPage({ searchParams: { sort: "downloads" } }));

  expect(screen.getByRole("link", { name: /按下载量排序/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /按更新时间排序/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /按提交时间排序/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/skills-page.test.tsx`
Expected: FAIL because the catalogue currently has no sort controls or download metadata.

**Step 3: Write minimal implementation**

- Extend `listLatestApprovedSkills` to accept `sort: "downloads" | "updated" | "created"`
- Order by:
  - `totalDownloadCount desc`
  - `updatedAt desc`
  - `createdAt desc`
- Include `totalDownloadCount`, `createdAt`, and `updatedAt` in `SkillCardRecord`
- Add a small `CatalogueSortBar` component with Chinese links
- Update `SkillCard` to show downloads and both dates clearly

```ts
const orderBy =
  sort === "created"
    ? { createdAt: "desc" }
    : sort === "updated"
      ? { updatedAt: "desc" }
      : { totalDownloadCount: "desc" };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/skills-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/skills/page.tsx src/components/skills/skill-card.tsx src/components/skills/catalogue-sort-bar.tsx src/lib/skills/queries.ts src/test/ui/skills-page.test.tsx
git commit -m "feat: add public catalogue sorting and metadata"
```

### Task 6: Update the public detail page with release actions and version metrics

**Files:**
- Modify: `src/app/skills/[slug]/page.tsx`
- Modify: `src/components/skills/version-switcher.tsx`
- Create: `src/components/skills/public-version-actions.tsx`
- Modify: `src/test/ui/skill-detail-page.test.tsx`
- Modify: `src/test/ui/version-switcher.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import SkillDetailPage from "@/app/skills/[slug]/page";

test("detail page shows public update and release actions", async () => {
  render(await SkillDetailPage({ params: { slug: "superpowers" }, searchParams: { version: "v1.0.0" } }));

  expect(screen.getByRole("link", { name: /更新说明/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /发布新版本/i })).toBeInTheDocument();
  expect(screen.getByText(/下载量/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/test/ui/skill-detail-page.test.tsx src/test/ui/version-switcher.test.tsx`
Expected: FAIL because the public detail page currently exposes only reading and downloading.

**Step 3: Write minimal implementation**

- Extend `getSkillDetail` to return:
  - `selectedVersion.downloadCount`
  - `skill.createdAt`
  - `skill.updatedAt`
- Add a `PublicVersionActions` component that links to:
  - `/submit?from=<slug>&base=<version>&mode=docs`
  - `/submit?from=<slug>&base=<version>&mode=release`
- Reword version switcher copy in Chinese
- Show first publication time, latest update time, selected-version download count, and bundle button

```tsx
<Link href={`/submit?from=${skillSlug}&base=${encodeURIComponent(currentVersion)}&mode=docs`}>
  更新说明
</Link>
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/test/ui/skill-detail-page.test.tsx src/test/ui/version-switcher.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/skills/[slug]/page.tsx src/components/skills/version-switcher.tsx src/components/skills/public-version-actions.tsx src/test/ui/skill-detail-page.test.tsx src/test/ui/version-switcher.test.tsx
git commit -m "feat: add public detail actions for new versions"
```

### Task 7: Count bundle downloads and verify the new public flow end to end

**Files:**
- Modify: `src/app/api/files/[...path]/route.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/test/domain/file-route.test.ts`
- Create: `tests/e2e/public-release.spec.ts`

**Step 1: Write the failing tests**

```ts
import { isBundleUploadPath } from "@/lib/storage";

test("only bundle paths count as downloadable release artifacts", () => {
  expect(isBundleUploadPath("bundles/demo.zip")).toBe(true);
  expect(isBundleUploadPath("covers/demo.png")).toBe(false);
});
```

```ts
import { test, expect } from "@playwright/test";

test("a submission becomes public immediately and bundle download is available", async ({ page }) => {
  await page.goto("/submit");
  await expect(page.getByText(/提交后会立即公开/i)).toBeVisible();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/test/domain/file-route.test.ts`
Expected: FAIL because there is no bundle-path helper and no counter logic.

Run: `npm run test:e2e -- public-release.spec.ts`
Expected: FAIL because the public-release flow and Chinese expectations are not implemented yet.

**Step 3: Write minimal implementation**

- Add an `isBundleUploadPath` helper in `src/lib/storage.ts`
- In the file route:
  - resolve the path safely as before
  - if the path starts with `bundles/`, increment both `SkillVersion.downloadCount` and `Skill.totalDownloadCount` before returning the file
  - leave cover requests as read-only
- Add a Playwright test that:
  - submits a new skill
  - confirms redirect to the public detail page
  - publishes a follow-up version from the public action button
  - downloads the bundle
  - checks that the skill appears in `/skills?sort=downloads`

```ts
if (isBundleUploadPath(relativePath)) {
  await prisma.skillVersion.updateMany({
    where: { bundlePath: relativePath },
    data: { downloadCount: { increment: 1 } }
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/test/domain/file-route.test.ts`
Expected: PASS

Run: `npm run test:e2e -- public-release.spec.ts`
Expected: PASS

**Step 5: Run final verification**

Run: `npm run lint && npm test && npm run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/api/files/[...path]/route.ts src/lib/storage.ts src/test/domain/file-route.test.ts tests/e2e/public-release.spec.ts
git commit -m "feat: track bundle downloads for public releases"
```
