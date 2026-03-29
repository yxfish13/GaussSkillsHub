# Gauss Skills Hub Community Catalogue Design

Date: 2026-03-29
Topic: compact list browsing, public search, skill-level comments, and upvote/downvote ranking

## Context

The repository already supports:

- public skill publishing through `/submit`
- immutable version history under `/skills/[slug]`
- download counts
- Chinese-first product copy
- public release without admin approval

The next product change is about making the catalogue easier to manage as the number of skills grows, while also adding lightweight community feedback.

The approved requirements are:

- replace the large catalogue cards with a denser list-row layout
- add a visible search UI to `/skills`
- support sorting by upvotes and downvotes in addition to existing time and download sorting
- add comments to each skill detail page
- add upvote and downvote actions to each skill detail page
- keep the product account-free
- require a real name for publishing a new skill or a new version
- require a real name for posting a comment

## Recommendation

Keep the public release model and version history exactly as-is, but add community interaction at the `Skill` level rather than the `SkillVersion` level.

This is the safest approach because:

- list ranking should reflect the popularity of the skill as a whole
- comments should stay visible no matter which version is currently selected
- version history remains clean and content-focused
- the interaction system can stay lightweight without introducing a full identity model

The fastest path is to extend the existing `Skill` record with aggregate vote counts, add separate comment and vote tables, and reshape the `/skills` UI into a dense directory page.

## Product Model

Gauss Skills Hub becomes a searchable community catalogue:

- publishing remains public and immediate
- versions remain immutable
- discussion and sentiment happen at the skill level
- discovery increasingly depends on community feedback, not only downloads

This creates a clear separation:

- `SkillVersion` answers: what changed in this release?
- `Skill` answers: is this project valuable to the community?

## Interaction Scope

### Publishing

Publishing still happens through `/submit`, but the submission form changes from optional attribution to required attribution.

Rules:

- creating a new skill requires `submitterName`
- creating a new version requires `submitterName`
- historical records keep their original name
- old unnamed records may render as `未署名`, but new submissions must not be anonymous

### Comments

Comments are public and account-free.

Rules:

- each comment belongs to a `Skill`
- comment author name is required
- comment content is required
- comments are shown newest first
- first version does not support editing, deleting, replies, or threading

### Voting

Votes are also public and account-free, but each browser keeps only one current position per skill.

Rules:

- a browser can have one of three states per skill: `upvote`, `downvote`, or neutral
- pressing the same vote again removes the vote
- pressing the opposite vote switches the current vote
- counts shown on the site are aggregate totals stored on `Skill`

## Data Model

### `Skill`

Keep:

- `id`
- `slug`
- `createdAt`
- `updatedAt`
- `totalDownloadCount`
- `latestApprovedVersionId`

Add:

- `totalUpvoteCount`
- `totalDownvoteCount`

These aggregates drive catalogue sorting and detail-page summary metrics.

### `SkillVersion`

Keep the current structure for:

- `version`
- `title`
- `summary`
- `markdownContent`
- file metadata
- timestamps
- status

Change submission rules:

- `submitterName` becomes required for new data

This keeps version history intact while making authorship explicit.

### `SkillComment`

Add a new table with:

- `id`
- `skillId`
- `authorName`
- `content`
- `createdAt`
- `updatedAt`

The first version only needs append-only behavior.

### `SkillVote`

Add a new table with:

- `id`
- `skillId`
- `browserTokenHash`
- `value`
- `createdAt`
- `updatedAt`

Constraints:

- unique index on `(skillId, browserTokenHash)`

This is enough to support anonymous one-browser-one-position voting without storing raw browser identifiers.

## Anonymous Identity Strategy

The system does not introduce user accounts.

Instead:

- the server issues a stable anonymous browser token in a cookie
- only a hash of that token is stored in the database
- votes resolve identity from the cookie
- comments rely only on the submitted name, not on persistent identity

This keeps the interaction model low-friction while still preventing unlimited duplicate voting from a single browser.

## Catalogue Design

The `/skills` page must shift from a gallery to a directory.

### Layout

Replace the current large card grid with compact list rows.

Each row should show:

- skill title
- one-line or two-line summary
- current public version
- current version submitter name
- total upvotes
- total downvotes
- total downloads
- updated date
- detail-page link

Large cover art should no longer dominate the page. Cover images can be omitted from the catalogue row entirely, or reduced to a tiny accent later if needed.

### Search

The catalogue already accepts `q` in route params, but the UI does not expose it.

Add a visible search form above the list.

Search scope should include:

- skill title
- summary
- slug
- current version submitter name

The search state must compose with sorting in the URL.

### Sorting

Supported sort modes become:

- `upvotes`
- `downvotes`
- `downloads`
- `updated`
- `created`

Default sort should change to `upvotes`.

Rationale:

- downloads show usage
- upvotes show approval
- downvotes show friction or dissatisfaction
- updated shows recent maintenance
- created shows new arrivals

### Empty States

Catalogue empty-state behavior must distinguish between:

- no public skills at all
- no matches for the current search

This makes search feel intentional instead of broken.

## Detail Page Design

The `/skills/[slug]` page remains a reading page, but it gains a stronger community layer.

### Header Metrics

Show:

- title
- summary
- selected version
- selected-version submitter name
- total upvotes
- total downvotes
- total downloads
- first publication date
- latest update date

### Primary Actions

Keep:

- `下载附件`
- `更新说明`
- `发布新版本`

Add:

- `点赞`
- `点踩`

Vote buttons should visually reflect the current browser state.

### Comments Section

Place comments below the markdown body.

Structure:

- comment form with `姓名` and `评论内容`
- recent comments list
- each comment shows author name, timestamp, and content

Comments should attach to the skill overall, not to the selected version.

That means visitors can switch versions without losing sight of the skill’s discussion.

## Submission Form Changes

The public submission flow keeps the current route shape, but the form rules change.

Required fields for all publish modes:

- `技能名称`
- `唯一标识`
- `版本号`
- `一句话简介`
- `详细介绍（Markdown）`
- `技能压缩包` when required by mode
- `姓名`

Optional:

- `联系方式`
- cover image, if retained

Even if cover upload remains available internally, the main catalogue experience should no longer depend on it.

## Validation and Error Handling

### Submission

- reject empty or whitespace-only submitter names
- keep current duplicate `(skillId, version)` protection
- keep bundle validation rules by mode

### Comments

- reject empty author names
- reject empty comment bodies
- cap comment length to a reasonable size, such as 1000 characters

### Votes

- treat invalid vote directions as bad input
- ensure aggregate counters stay in sync when toggling or switching votes

### Search and Sort

- blank search falls back to the full list
- invalid sort values fall back to `upvotes`

## Compatibility

The redesign must preserve existing public data.

Compatibility rules:

- existing skills and versions remain valid
- existing unnamed versions render as `未署名` in the UI
- new submissions require a name
- old routes and version URLs continue to work

This avoids breaking current seeded examples or public links while tightening rules for all new content.

## Testing Strategy

Testing needs to cover both behavior and ranking correctness.

### Domain tests

- submission validation requires submitter name
- comment validation requires author name and content
- vote toggling and switching update counts correctly
- catalogue sort queries return expected order for upvotes and downvotes

### UI tests

- `/skills` renders the compact list row layout
- search form keeps query state
- sorting links preserve search query
- detail page renders vote metrics, vote actions, and comment form

### E2E

Add one public interaction flow:

- publish a new skill with required name
- open the detail page
- upvote it
- confirm ranking on `/skills?sort=upvotes`
- add a comment with name
- confirm the comment renders

## Non-Goals

This iteration does not include:

- user accounts
- threaded comments
- comment editing or deletion
- comment moderation tools
- comment reactions
- vote history pages
- per-version comments or per-version voting

These omissions keep the feature focused and aligned with the no-account requirement.
