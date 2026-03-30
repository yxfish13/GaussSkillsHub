# Gauss Skills Hub Skill Visibility Controls Design

Date: 2026-03-30
Topic: public hide actions, admin hide and delete actions, confirmation prompts, and sample-data cleanup

## Context

The current product publishes skills publicly and supports immutable versions, comments, votes, and admin maintenance. The next requirement is operational control over an entire skill:

- administrators can hide or delete a skill
- ordinary visitors can hide a skill directly from the public detail page
- destructive actions must require an explicit confirmation prompt
- hidden skills must disappear from the public catalogue and public detail pages
- after verification, test and smoke data should be removed so only 1-2 sample skills remain

## Recommendation

Add a skill-level visibility state on `Skill` instead of trying to infer visibility from version status.

This keeps concerns separated:

- `SkillVersion.status` continues to represent version publication history
- `Skill.visibility` represents whether the overall skill is visible to the public
- public list/detail queries can filter in one place
- admin flows can keep accessing hidden skills without weakening public filtering

## Data Model

Add `SkillVisibility` with these states:

- `public`
- `hidden`

Update `Skill`:

- add `visibility SkillVisibility @default(public)`

Behavior:

- newly submitted skills remain `public`
- public hide action switches `Skill.visibility` to `hidden`
- admin hide action also switches to `hidden`
- admin restore switches `hidden` back to `public`
- admin delete removes the entire skill tree and associated stored files

## Public Experience

On `/skills/[slug]`, add a small danger-zone action for ordinary visitors:

- button label: `下架这个 Skill`
- confirmation copy: `确认下架后，这个 Skill 将从公开列表和详情页中隐藏。`
- action result: redirect to `/skills?status=hidden`

Once hidden:

- the skill no longer appears on `/skills`
- direct public access to `/skills/[slug]` returns not found

## Admin Experience

Keep admin skill management lightweight by adding skill-level controls to the existing admin review page.

Admin actions:

- `下架 Skill`
- `恢复 Skill`
- `删除 Skill`

Confirmations:

- hide: `确认下架后，这个 Skill 将从公开站点隐藏。`
- restore: `确认恢复后，这个 Skill 会重新出现在公开站点。`
- delete: `删除后将同时移除版本、评论、点赞和上传文件，此操作不可恢复。`

Delete is physical deletion, not soft delete.

## Query and Routing Rules

Public queries must require `Skill.visibility = public`:

- `/skills`
- `/skills/[slug]`
- any public prefill flow based on existing public skills

Admin queries should not filter hidden skills out, otherwise restoration would be impossible.

## File Cleanup

When deleting a skill:

- load all related versions first
- collect `coverImagePath` and `bundlePath`
- delete database records inside a transaction
- remove stored files after the transaction using best-effort cleanup

If file cleanup fails after database deletion, the system should not reintroduce the deleted skill. The remaining risk is orphaned files, not public inconsistency.

## Testing

Add coverage for:

- visibility filtering in public queries
- public hide action behavior
- admin hide, restore, and delete behavior
- UI rendering of public/admin action buttons
- end-to-end public hide and admin restore/delete flows

After verification, clean the seeded smoke/e2e rows and uploaded bundles, leaving only 1-2 intentional demo skills.
