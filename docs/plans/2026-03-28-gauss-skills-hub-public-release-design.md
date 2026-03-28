# Gauss Skills Hub Public Release Design

Date: 2026-03-28
Topic: immediate public skill publishing, immutable version history, Chinese UI copy, and download-driven discovery

## Context

The current repository already implements the first moderation-oriented MVP:

- anonymous submission through `/submit`
- public catalogue and detail pages under `/skills`
- single-admin review and approval flow under `/admin`
- markdown rendering and version history
- bundle and cover file storage on local disk

That foundation is useful, but the approved product direction has changed.

The revised requirements are:

- rename the product to `Gauss Skills Hub`
- make the public website Chinese-first
- remove admin review from the primary publishing flow
- make a submission visible immediately
- keep version history immutable
- let visitors create a new version from an existing public skill
- add download counts and support sorting by downloads, created time, and updated time

## Recommendation

Keep the existing Next.js monolith, Prisma schema, and local file storage, but change the business model from moderated publishing to public release publishing.

This is the lowest-risk path because:

- the public pages, submission flow, and version model already exist
- `Skill` and `SkillVersion` still fit the new product
- the old admin area can remain as a maintenance surface instead of a release gate
- the redesign mainly changes transition rules, public entry points, and catalogue ranking

The fastest safe approach is to preserve most table names and route shapes, then shift their semantics.

## Product Model

The site becomes a public skill archive with versioned releases.

### Public discovery

Visitors browse public skills from:

- `/`
- `/skills`
- `/skills/[slug]`

The catalogue defaults to ranking by download volume, but visitors can switch to newest updates or newest submissions.

### Public publishing

Visitors can:

- publish a brand new skill
- publish a new version of an existing skill
- update the description of an existing skill by creating a new documentation-focused version

There is no in-place editing of an existing version. Every change creates a new version record.

### Admin maintenance

The admin area is no longer part of the main release flow.

It may remain in the codebase for later moderation, abuse cleanup, or manual recovery, but the public product promise is now:

> submit a version and it becomes public immediately.

## Brand and Language

The site brand becomes `Gauss Skills Hub`.

UI expectations:

- the title can remain English for brand recognition
- navigation, buttons, field labels, feedback messages, and section copy should be Chinese
- public pages should feel like a community skill market rather than an editorial review archive

Examples:

- `技能广场`
- `提交 Skill`
- `更新说明`
- `发布新版本`
- `下载附件`
- `按下载量排序`

## Data Model

The current schema is close enough. Do not rebuild it from scratch.

### `Skill`

Keep:

- `id`
- `slug`
- `createdAt`
- `updatedAt`
- `latestApprovedVersionId`

Add:

- `totalDownloadCount`

Notes:

- `createdAt` becomes the first-publication time for this skill
- `updatedAt` represents the latest release time for the skill
- `latestApprovedVersionId` can remain for compatibility even though the product language now calls it the latest public version

### `SkillVersion`

Keep:

- `skillId`
- `version`
- `title`
- `summary`
- `markdownContent`
- file metadata
- submitter metadata
- timestamps
- `status`

Add:

- `downloadCount`

Rules:

- `(skillId, version)` remains unique
- historical versions stay readable
- old versions are never overwritten

### Status model

Keep the existing enum for compatibility, but change the default flow:

- new public submissions become `approved` immediately
- the previous latest public version becomes `archived`
- `archived` versions remain visible in version history
- `rejected` stops being a normal visitor flow and becomes a maintenance-only state

This avoids a disruptive schema rewrite while changing user-visible behavior.

## Download Counts

Download counts should be explicit and trustworthy.

Rules:

- only bundle downloads increment counters
- cover image requests do not increment counters
- every bundle download increments:
  - `SkillVersion.downloadCount`
  - `Skill.totalDownloadCount`

This supports both version-level detail pages and skill-level ranking.

## Sorting

The catalogue needs three clear sort modes:

- `downloads`
  sort by `Skill.totalDownloadCount desc`
- `updated`
  sort by `Skill.updatedAt desc`
- `created`
  sort by `Skill.createdAt desc`

These modes have distinct meanings:

- popularity
- recency of maintenance
- recency of first publication

The public `/skills` page should default to `downloads`.

## Routes and Information Architecture

### Public

- `/`
  Chinese landing page with brand messaging, popular skills, recent updates, and a publish call-to-action
- `/skills`
  searchable public catalogue with sorting controls
- `/skills/[slug]`
  public detail page for the latest version by default
- `/skills/[slug]?version=v1.2.0`
  public detail page for a historical version
- `/submit`
  submission form for new skills and new versions

### Submission entry modes

The detail page should expose two clear actions:

- `更新说明`
  opens `/submit?from=<slug>&base=<version>&mode=docs`
- `发布新版本`
  opens `/submit?from=<slug>&base=<version>&mode=release`

Both routes prefill from the selected public version.

Mode-specific behavior:

- `docs`
  encourages text edits and may reuse the previous bundle when no new archive is uploaded
- `release`
  encourages a new version number and a new bundle upload

## Public Page Behavior

### Home page

The home page should shift from editorial archive language to public release language.

Suggested content blocks:

- brand hero for `Gauss Skills Hub`
- CTA to `提交 Skill`
- a popular skills strip based on download count
- a recent updates strip based on `updatedAt`

### Catalogue page

The list page should show:

- cover image
- title
- summary
- latest version
- total downloads
- first submission date
- last update date

Sorting and search should be visible above the grid.

### Detail page

The detail page should show:

- title and summary
- current version
- download count for the selected version
- first submission time
- latest update time
- bundle download button
- `更新说明`
- `发布新版本`
- markdown body
- historical version switcher

The visitor should always understand that changing content creates a new version instead of mutating the current one.

## Submission Flow

The submission form must support three cases:

1. a brand new skill
2. a documentation refresh of an existing skill
3. a full new release of an existing skill

Behavior:

- if a `slug` does not exist, create a new `Skill`
- if a `slug` exists, create a new `SkillVersion`
- if a new version becomes public, archive the previous latest public version
- after success, redirect straight to the public detail page for that new version

The previous success-state query string can be removed from the primary flow because the new detail page is the strongest confirmation page.

## Compatibility and Migration Strategy

This redesign should reuse the current codebase rather than replace it.

Recommended transition:

- keep current admin code paths for now
- keep current enum and foreign key names
- change submission behavior to publish immediately
- update catalogue queries so public pages stop filtering on an approval workflow assumption
- add counters and sort metadata through an additive Prisma schema change

That reduces breakage and lets the repo migrate without a large refactor.

## Risks and Mitigations

### Open publishing invites noisy submissions

Mitigation:

- keep admin pages as a maintenance backstop
- keep strict file and text validation
- preserve immutable history so bad edits do not destroy prior versions

### Download counts can be inflated by asset requests

Mitigation:

- increment counts only for bundle paths under `bundles/`
- never increment counts for image requests

### Public update actions can confuse users about overwriting

Mitigation:

- the detail page and submit page should explicitly say that changes create a new version
- default prefilled flows should always ask for a new version number

## Testing Strategy

Focus verification on the changed behaviors:

- domain tests for public-release transitions and archive rules
- domain tests for optional bundle reuse in documentation mode
- query tests or UI tests for catalogue sorting
- route tests for bundle-only download counting
- UI tests for Chinese labels and public action buttons
- Playwright flow covering:
  - submit a skill
  - see it public immediately
  - publish a follow-up version
  - download the bundle
  - confirm ranking metadata appears

## Outcome

After this redesign, `Gauss Skills Hub` behaves like a public release platform:

- publishing is immediate
- version history stays intact
- updates are driven from public pages
- discovery can be ranked by popularity or recency
- the product language matches a Chinese-speaking audience
