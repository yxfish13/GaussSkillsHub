# Skills Hub Design

Date: 2026-03-28
Topic: anonymous skill submissions, admin review, markdown-based skill details, and content versioning

## Context

The repository is currently an empty project directory with only `.gitignore`. The product therefore needs a ground-up design that chooses the application architecture, data model, visual direction, and implementation boundaries before any scaffolding begins.

The approved product requirements are:

- Build a website, not a desktop app.
- Use a single full-stack application architecture.
- Anyone can upload a skill submission.
- Only an administrator can review and approve or reject submissions.
- Each skill needs a short summary and a full detail page.
- The detail page must render markdown and support editing.
- Version management is content-first: each skill has `v1`, `v2`, `v3`, and each version owns its own summary, markdown body, files, and review status.
- Uploads include both structured metadata plus files, specifically a cover image and a zip/source bundle.
- Use PostgreSQL for structured data and local disk storage for uploaded files.
- Rejected submissions must be editable and resubmittable.
- Public detail pages should default to the latest approved version but allow visitors to switch to approved historical versions.

## Recommendation

Use a Next.js App Router monolith with TypeScript, Prisma, PostgreSQL, local disk storage, and a cookie-based single-admin authentication layer.

This balances speed and clarity:

- One deployable app handles public pages, admin pages, server-side mutations, and file serving.
- Prisma gives a clean model for `Skill` and `SkillVersion`.
- Local disk storage is enough for the first release and can later be swapped for object storage without changing the product shape.
- A single admin login is materially simpler than building a general-purpose user system before the product proves itself.

## Product Model

The product has three surfaces:

### 1. Public catalogue

Visitors browse approved skills. The homepage and `/skills` list show the latest approved version of each skill. Each card contains the cover image, title, short summary, published version, and updated time.

### 2. Anonymous submission flow

Any visitor can submit:

- a brand new skill, or
- a new version for an existing skill

The submission includes:

- title
- slug
- semantic-ish version string
- short summary
- markdown description
- cover image
- zip/source attachment
- optional submitter nickname/contact

Submission creates a `submitted` version awaiting review.

### 3. Admin review workspace

The administrator logs into a protected backend and can:

- filter versions by status
- inspect metadata and uploaded files
- edit summary and markdown
- approve or reject a version
- save changes and resubmit a rejected version

The admin review page is also the markdown editing surface, so reviewers do not need a separate CMS.

## Architecture

### Application structure

Use one Next.js app with App Router:

- server components for public read pages
- client components for interactive forms and markdown editing
- server actions and route handlers for mutations and file downloads
- Prisma for database access
- local filesystem storage under `storage/` for uploads

### Rendering strategy

- Public catalogue and public skill details should be server-rendered for fast first load and shareable URLs.
- Admin pages can mix server and client components, with client-side markdown editing and live preview where useful.
- Markdown display should be rendered through `react-markdown` with `remark-gfm` and `rehype-sanitize` to prevent unsafe HTML injection.

### File handling

Uploaded files should not be served directly from an uncontrolled public directory. Instead:

- persist files under `storage/uploads/covers/` and `storage/uploads/bundles/`
- store normalized metadata and file paths in the database
- expose controlled file access through a route handler that can enforce existence checks and appropriate content headers

This keeps the public asset story simple while avoiding direct unmanaged writes into `public/`.

## Data Model

Four entities are enough for the first version.

### `AdminUser`

Single-admin authentication table.

Fields:

- `id`
- `username`
- `passwordHash`
- `createdAt`
- `updatedAt`

### `Skill`

Stable identity for a skill project.

Fields:

- `id`
- `slug`
- `createdAt`
- `updatedAt`
- `latestApprovedVersionId` nullable pointer for fast public lookup

`Skill` does not own the summary or body content. Those belong to versions.

### `SkillVersion`

Primary business record.

Fields:

- `id`
- `skillId`
- `version`
- `title`
- `summary`
- `markdownContent`
- `coverImagePath`
- `coverImageName`
- `bundlePath`
- `bundleName`
- `submitterName` nullable
- `submitterContact` nullable
- `status`
- `reviewNotes` nullable
- `submittedAt`
- `reviewedAt` nullable
- `createdAt`
- `updatedAt`

Constraints:

- unique `(skillId, version)`
- skill lookup indexed by `(skillId, status, createdAt desc)`
- slug uniqueness enforced at `Skill`

### `VersionReviewLog`

Audit trail for every state change.

Fields:

- `id`
- `skillVersionId`
- `fromStatus`
- `toStatus`
- `note`
- `actorType` such as `system` or `admin`
- `actorId` nullable
- `createdAt`

## State Model

Version statuses:

- `draft`
- `submitted`
- `approved`
- `rejected`
- `archived`

Rules:

- Anonymous submissions enter `submitted`.
- `approved` versions are public.
- When a newer version is approved, the previous approved version becomes `archived`.
- `archived` versions remain publicly visible in version history.
- `rejected` versions are hidden from public pages but remain editable inside admin.
- Rejected versions can move back to `submitted` after edits.

This keeps the public model easy to understand: visitors see the latest approved version first, but history remains available.

## Routes and Information Architecture

### Public

- `/` landing page with featured approved skills and a prominent submit call-to-action
- `/skills` searchable catalogue of latest approved skills
- `/skills/[slug]` detail page for the latest approved version
- `/skills/[slug]?version=v1.2.0` detail page for a specific approved historical version
- `/submit` anonymous submission form

### Admin

- `/admin/login` password login page
- `/admin` review dashboard with counts, status filters, and queue
- `/admin/versions/[id]` review and edit page with markdown editor + live preview

### Supporting routes

- `/api/files/[...path]` controlled file download for cover images and bundles

## Key Interactions

### Public browse

- Card-based browsing with search on title, summary, or slug.
- Strong visual differentiation between the hero surface and the catalogue rows to avoid a flat generic grid.

### Detail page

- Header with title, summary, version badge, update date, and download button if a bundle exists.
- Main content is a markdown document view, not a form-like layout.
- Version switcher allows jumping between approved historical versions.

### Submission

- Form can either create a new skill or a new version for an existing slug.
- If a slug exists, the system binds the submission to the existing `Skill`.
- Validation checks file type, size, missing required fields, duplicate version values, and malformed slug input.

### Review

- Admin dashboard prioritizes `submitted` items.
- Review detail page shows metadata and attachments alongside an editable markdown pane and a live rendered preview.
- Reject requires a note.
- Approve updates the public pointer on `Skill` and archives the previously approved version.

## Visual Direction

The frontend should not look like a default SaaS dashboard. The chosen direction is an editorial technical archive:

- warm paper background instead of plain white
- deep ink text with a sharp signal accent, such as safety orange or oxide red
- expressive display typography for headings paired with a disciplined serif or humanist body font
- layered grids, ruled dividers, badges, and metadata blocks that make skills feel like curated artifacts
- subtle motion on list reveal and version switches, but no generic floating cards

This direction fits the product well because the site is both a library and a review workflow. It should feel curated and technical, not merely transactional.

## Security and Validation

- Hash the admin password with bcrypt.
- Store admin session in signed cookies.
- Sanitize markdown output.
- Validate all mutation payloads with Zod.
- Restrict uploads to known image formats for covers and zip-compatible archives for bundles.
- Enforce file size caps before writes.
- Clean up partially written files if database persistence fails.

## Testing Strategy

- Unit tests for validation, slug/version rules, version state transitions, and markdown helpers.
- Integration-style tests for submission and review actions.
- Component tests for public list, detail rendering, version switching UI, and admin queue views.
- End-to-end smoke coverage for anonymous submission, admin login, approve flow, reject-and-resubmit flow, and history browsing.

## First Release Boundaries

Included:

- single admin login
- anonymous submission
- admin review queue
- markdown rendering and editing
- version history browsing
- local file storage

Explicitly deferred:

- multi-admin roles
- OAuth/login providers
- object storage
- diff viewer between versions
- tags, comments, likes, or package install analytics

## Environment Notes

This design was written before scaffolding because the repository is empty. The current directory is also not a Git repository, so the brainstorming skill's "commit the design doc" step is blocked by environment state and cannot be completed yet without initializing Git first.
