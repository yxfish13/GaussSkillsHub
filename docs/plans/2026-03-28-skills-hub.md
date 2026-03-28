# Skills Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js full-stack skills management website with anonymous skill submissions, admin review, markdown rendering/editing, file uploads, and approved-version history backed by PostgreSQL and local file storage.

**Architecture:** Use a single Next.js App Router application with server-rendered public pages, protected admin pages, Prisma for data access, signed cookie-based single-admin authentication, and local disk storage under `storage/` for uploaded images and bundles. Model `Skill` as the stable identity and `SkillVersion` as the versioned content unit so approval, rejection, editing, and history browsing all happen per version.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Zod, bcryptjs, jose, react-markdown, remark-gfm, rehype-sanitize, Vitest, Testing Library, Playwright

---

## Prerequisites

- If the directory still has no Git history, run `git init` before starting Task 1 so commits are possible.
- Provide a PostgreSQL database URL in `.env`.
- Decide the admin bootstrap credentials in `.env`, for example `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Proposed File Layout

- `package.json`
- `next.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/skills/page.tsx`
- `src/app/skills/[slug]/page.tsx`
- `src/app/submit/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/versions/[id]/page.tsx`
- `src/app/api/files/[...path]/route.ts`
- `src/app/actions/submissions.ts`
- `src/app/actions/admin.ts`
- `src/components/*`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/lib/env.ts`
- `src/lib/storage.ts`
- `src/lib/markdown.ts`
- `src/lib/skills/service.ts`
- `src/lib/skills/queries.ts`
- `src/lib/skills/types.ts`
- `src/test/*`
- `storage/uploads/covers/.gitkeep`
- `storage/uploads/bundles/.gitkeep`

### Task 1: Bootstrap the Next.js workspace and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Test: `src/test/smoke/home-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

test("home page exposes the project title and submit action", () => {
  render(<HomePage />);

  expect(screen.getByText(/skills hub/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /submit a skill/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/smoke/home-page.test.tsx`
Expected: FAIL because the app scaffold and homepage component do not exist yet.

**Step 3: Write minimal implementation**

- Scaffold the app with App Router and Tailwind.
- Add Vitest + Testing Library setup.
- Implement a minimal `src/app/page.tsx` that renders `Skills Hub` and a `Submit a Skill` link.

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Skills Hub</h1>
      <a href="/submit">Submit a Skill</a>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/smoke/home-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold next app and test harness"
```

### Task 2: Establish the visual system and public shell

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/layout/site-header.tsx`
- Create: `src/components/layout/site-footer.tsx`
- Create: `src/components/ui/section-heading.tsx`
- Test: `src/test/ui/site-shell.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

test("root layout renders archive navigation links", () => {
  render(
    <RootLayout>
      <div>child</div>
    </RootLayout>,
  );

  expect(screen.getByRole("link", { name: /browse skills/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /submit/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/site-shell.test.tsx`
Expected: FAIL because the shell components and nav links are missing.

**Step 3: Write minimal implementation**

- Set CSS variables in `src/app/globals.css` for the editorial archive direction.
- Add a root layout with header and footer.
- Use distinctive fonts and metadata treatments rather than default dashboard styling.

```css
:root {
  --paper: #f4efe5;
  --ink: #171717;
  --signal: #c6521b;
  --line: rgba(23, 23, 23, 0.16);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/site-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/layout src/components/ui
git commit -m "feat: add editorial archive layout shell"
```

### Task 3: Define the database schema and admin seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/env.ts`
- Test: `src/test/domain/version-status.test.ts`

**Step 1: Write the failing test**

```ts
import { archivePreviousStatus, canResubmitStatus } from "@/lib/skills/types";

test("approved versions archive the previous approved version", () => {
  expect(archivePreviousStatus("approved")).toBe("archived");
});

test("rejected versions can be resubmitted", () => {
  expect(canResubmitStatus("rejected")).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/version-status.test.ts`
Expected: FAIL because version status helpers do not exist.

**Step 3: Write minimal implementation**

- Add Prisma models for `AdminUser`, `Skill`, `SkillVersion`, and `VersionReviewLog`.
- Add `SkillVersionStatus` enum with `draft`, `submitted`, `approved`, `rejected`, `archived`.
- Add a small domain helper module for state rules.
- Add a seed script that upserts the single admin user from env vars.

```prisma
model SkillVersion {
  id              String   @id @default(cuid())
  skillId          String
  version          String
  title            String
  summary          String
  markdownContent  String
  status           SkillVersionStatus @default(submitted)
  @@unique([skillId, version])
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/version-status.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma src/lib/db.ts src/lib/env.ts src/lib/skills/types.ts src/test/domain/version-status.test.ts
git commit -m "feat: add prisma schema and version status domain rules"
```

### Task 4: Implement upload storage and submission validation

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/skills/validation.ts`
- Create: `src/app/actions/submissions.ts`
- Create: `storage/uploads/covers/.gitkeep`
- Create: `storage/uploads/bundles/.gitkeep`
- Test: `src/test/domain/submission-validation.test.ts`

**Step 1: Write the failing test**

```ts
import { submissionSchema } from "@/lib/skills/validation";

test("rejects invalid bundle file types", () => {
  const result = submissionSchema.safeParse({
    title: "Demo",
    slug: "demo",
    version: "v1.0.0",
    summary: "Summary",
    markdownContent: "# Demo",
    bundleMimeType: "application/pdf",
  });

  expect(result.success).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/submission-validation.test.ts`
Expected: FAIL because the validation schema does not exist.

**Step 3: Write minimal implementation**

- Define Zod validation for slug, version, summary length, markdown body, image types, and zip bundle types.
- Implement `saveUpload(file, kind)` in `src/lib/storage.ts`.
- Add a submission action that:
  - validates form data
  - creates or reuses a `Skill`
  - prevents duplicate `(skillId, version)`
  - saves files to disk
  - persists a `submitted` version and review log

```ts
export const submissionSchema = z.object({
  title: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().min(2),
  summary: z.string().min(10).max(240),
  markdownContent: z.string().min(20),
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/submission-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/skills/validation.ts src/app/actions/submissions.ts storage/uploads
git commit -m "feat: add upload storage and submission validation"
```

### Task 5: Build public catalogue queries and list/detail pages

**Files:**
- Create: `src/lib/skills/queries.ts`
- Create: `src/components/skills/skill-card.tsx`
- Create: `src/components/skills/version-switcher.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/skills/page.tsx`
- Create: `src/app/skills/[slug]/page.tsx`
- Create: `src/lib/markdown.ts`
- Test: `src/test/ui/skill-detail-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import SkillDetailPage from "@/app/skills/[slug]/page";

test("detail page renders markdown body and version switcher metadata", async () => {
  render(
    await SkillDetailPage({
      params: Promise.resolve({ slug: "demo" }),
      searchParams: Promise.resolve({ version: "v1.0.0" }),
    }),
  );

  expect(screen.getByRole("heading", { name: /demo/i })).toBeInTheDocument();
  expect(screen.getByText(/v1.0.0/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/skill-detail-page.test.tsx`
Expected: FAIL because the query layer and detail page do not exist.

**Step 3: Write minimal implementation**

- Add query helpers to fetch:
  - latest approved skills for the catalogue
  - a single skill plus approved version history
  - a specific approved version by slug and version
- Render markdown with `react-markdown`, `remark-gfm`, and `rehype-sanitize`.
- Build the public pages and version switcher UI.

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
  {version.markdownContent}
</ReactMarkdown>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/skill-detail-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/skills/queries.ts src/components/skills src/app/page.tsx src/app/skills src/lib/markdown.ts
git commit -m "feat: add public catalogue and versioned detail pages"
```

### Task 6: Build the anonymous submission page and happy-path flow

**Files:**
- Create: `src/components/forms/skill-submission-form.tsx`
- Modify: `src/app/submit/page.tsx`
- Modify: `src/app/actions/submissions.ts`
- Test: `src/test/ui/submission-form.test.tsx`
- Test: `tests/e2e/submission.spec.ts`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import SubmitPage from "@/app/submit/page";

test("submit page exposes the required content and file fields", () => {
  render(<SubmitPage />);

  expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/cover image/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/bundle zip/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/submission-form.test.tsx`
Expected: FAIL because the page and form fields are missing.

**Step 3: Write minimal implementation**

- Create the public submission form.
- Bind it to the submission action.
- Show inline field errors and a success state after submission.
- Add a Playwright smoke flow that submits a fixture skill and confirms the success message.

```tsx
<input name="title" aria-label="Skill Name" />
<input name="version" aria-label="Version" />
<input type="file" name="coverImage" aria-label="Cover Image" />
<input type="file" name="bundle" aria-label="Bundle Zip" />
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/submission-form.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/forms/skill-submission-form.tsx src/app/submit/page.tsx src/app/actions/submissions.ts src/test/ui/submission-form.test.tsx tests/e2e/submission.spec.ts
git commit -m "feat: add anonymous skill submission flow"
```

### Task 7: Add admin authentication and route protection

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/actions/admin.ts`
- Test: `src/test/domain/admin-auth.test.ts`

**Step 1: Write the failing test**

```ts
import { createAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";

test("creates a signed cookie payload for a valid admin login", async () => {
  const ok = await verifyAdminPassword("secret", "$2b$10$examplehashplaceholder");
  expect(typeof createAdminSessionCookie({ adminId: "admin-1" })).toBe("string");
  expect(ok).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/admin-auth.test.ts`
Expected: FAIL because the auth helpers do not exist.

**Step 3: Write minimal implementation**

- Add bcrypt password verification.
- Sign and verify admin session cookies with `jose`.
- Build the login page and login/logout actions.
- Protect `/admin` routes with middleware or a server-side guard helper.

```ts
export async function verifyAdminPassword(input: string, hash: string) {
  return bcrypt.compare(input, hash);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/admin-auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/auth.ts src/middleware.ts src/app/admin/login/page.tsx src/app/actions/admin.ts src/test/domain/admin-auth.test.ts
git commit -m "feat: add single-admin auth and route protection"
```

### Task 8: Build the admin dashboard review queue

**Files:**
- Create: `src/components/admin/review-queue.tsx`
- Create: `src/components/admin/status-filter.tsx`
- Create: `src/app/admin/page.tsx`
- Modify: `src/lib/skills/queries.ts`
- Test: `src/test/ui/admin-dashboard.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import AdminDashboardPage from "@/app/admin/page";

test("admin dashboard renders queue sections for submitted versions", async () => {
  render(await AdminDashboardPage());

  expect(screen.getByText(/review queue/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ui/admin-dashboard.test.tsx`
Expected: FAIL because the dashboard page and review queue do not exist.

**Step 3: Write minimal implementation**

- Extend the query layer with admin-only version status queries.
- Build the dashboard with status tabs or filters.
- Render queue rows with title, slug, version, submit date, and status badge.

```tsx
<section>
  <h1>Review Queue</h1>
  <ReviewQueue versions={submittedVersions} />
</section>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ui/admin-dashboard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin src/app/admin/page.tsx src/lib/skills/queries.ts src/test/ui/admin-dashboard.test.tsx
git commit -m "feat: add admin review dashboard"
```

### Task 9: Build the admin review editor and state transitions

**Files:**
- Create: `src/components/admin/review-editor.tsx`
- Create: `src/components/admin/live-markdown-preview.tsx`
- Create: `src/app/admin/versions/[id]/page.tsx`
- Modify: `src/app/actions/admin.ts`
- Modify: `src/lib/skills/service.ts`
- Test: `src/test/domain/review-actions.test.ts`
- Test: `tests/e2e/admin-review.spec.ts`

**Step 1: Write the failing test**

```ts
import { applyReviewDecision } from "@/lib/skills/service";

test("approving a version archives the previous approved version", async () => {
  const result = await applyReviewDecision({
    currentApprovedVersionId: "prev",
    targetVersionId: "next",
    decision: "approved",
  });

  expect(result.archivePrevious).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/review-actions.test.ts`
Expected: FAIL because the review service and transition logic do not exist.

**Step 3: Write minimal implementation**

- Add service logic for:
  - approve
  - reject with required note
  - save edits
  - resubmit rejected versions
- Build the admin review page with metadata column, editable markdown textarea, and rendered preview.
- Add Playwright coverage for logging in, approving a pending version, and seeing it appear publicly.

```ts
if (decision === "approved") {
  archivePrevious = Boolean(currentApprovedVersionId);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/review-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/review-editor.tsx src/components/admin/live-markdown-preview.tsx src/app/admin/versions src/app/actions/admin.ts src/lib/skills/service.ts src/test/domain/review-actions.test.ts tests/e2e/admin-review.spec.ts
git commit -m "feat: add review editor and version approval flow"
```

### Task 10: Serve uploaded files and finish catalogue details

**Files:**
- Create: `src/app/api/files/[...path]/route.ts`
- Modify: `src/app/skills/[slug]/page.tsx`
- Modify: `src/components/skills/skill-card.tsx`
- Test: `src/test/domain/file-route.test.ts`

**Step 1: Write the failing test**

```ts
import { buildPublicFileHref } from "@/lib/storage";

test("builds a controlled public file URL", () => {
  expect(buildPublicFileHref("covers/demo.png")).toBe("/api/files/covers/demo.png");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/domain/file-route.test.ts`
Expected: FAIL because the helper and file route do not exist.

**Step 3: Write minimal implementation**

- Add a route handler that resolves files under `storage/uploads`.
- Return correct content headers and 404 on missing files.
- Update the public detail page and cards to use controlled file URLs for cover and bundle links.

```ts
export function buildPublicFileHref(relativePath: string) {
  return `/api/files/${relativePath}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/domain/file-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/files src/lib/storage.ts src/app/skills/[slug]/page.tsx src/components/skills/skill-card.tsx src/test/domain/file-route.test.ts
git commit -m "feat: add controlled file serving for uploads"
```

### Task 11: Add regression coverage and final polish for first release

**Files:**
- Modify: `tests/e2e/submission.spec.ts`
- Modify: `tests/e2e/admin-review.spec.ts`
- Create: `tests/e2e/version-history.spec.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/skills/page.tsx`
- Modify: `src/app/skills/[slug]/page.tsx`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("public detail page can switch to an approved historical version", async ({ page }) => {
  await page.goto("/skills/demo");
  await page.getByRole("button", { name: /versions/i }).click();
  await page.getByRole("link", { name: /v1.0.0/i }).click();
  await expect(page.getByText("v1.0.0")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/version-history.spec.ts`
Expected: FAIL because the version history switch flow is incomplete.

**Step 3: Write minimal implementation**

- Tighten typography, spacing, badge styling, and list composition.
- Ensure the public pages preserve the editorial archive direction.
- Finish the historical version switcher interaction and empty states.

```tsx
<aside aria-label="Version History">
  {approvedVersions.map((version) => (
    <Link key={version.id} href={`/skills/${skill.slug}?version=${version.version}`}>
      {version.version}
    </Link>
  ))}
</aside>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/version-history.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e src/app/page.tsx src/app/skills/page.tsx src/app/skills/[slug]/page.tsx
git commit -m "feat: polish public pages and historical version browsing"
```

### Task 12: Verify the whole first release

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

**Step 1: Write the failing test**

No new feature test. This task is a verification and documentation checkpoint.

**Step 2: Run verification commands**

Run: `npm run lint`
Expected: PASS

Run: `npm test`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npx prisma validate`
Expected: PASS

**Step 3: Write minimal implementation**

- Add setup and run instructions to `README.md`.
- Add `.env.example` documenting `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and auth secrets.

**Step 4: Re-run verification**

Run the full command set again:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
npx prisma validate
```

Expected: all commands pass cleanly.

**Step 5: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add project setup and verification notes"
```

## Notes for the Implementer

- Keep the first release single-admin only.
- Do not add tags, comments, or package analytics.
- Use local file storage only; do not wire S3/OSS yet.
- Preserve the editorial archive visual direction across public pages and the admin review workspace.
- Prefer server-side reads for public data and simple mutation boundaries through server actions/route handlers.
