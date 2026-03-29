import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

type SkillSubmission = {
  slug: string;
  title: string;
  version: string;
  submitter: string;
  summary: string;
  markdown: string;
};

const getCatalogueRows = (page: Page) => page.getByRole("list", { name: /skills 列表/i }).getByRole("listitem");

async function publishSkill(page: Page, skill: SkillSubmission) {
  await page.goto(`${baseUrl}/submit`);
  await page.getByLabel("技能名称").fill(skill.title);
  await page.getByLabel("唯一标识").fill(skill.slug);
  await page.getByLabel("版本号").fill(skill.version);
  await page.getByLabel("提交者").fill(skill.submitter);
  await page.getByLabel("一句话简介").fill(skill.summary);
  await page.getByLabel("详细介绍（Markdown）").fill(skill.markdown);
  await page.getByLabel("技能压缩包").setInputFiles({
    name: `${skill.slug}.zip`,
    mimeType: "application/zip",
    buffer: Buffer.from(`${skill.slug} bundle`)
  });
  await page.getByRole("button", { name: /立即发布/i }).click();

  await expect(page).toHaveURL(new RegExp(`/skills/${skill.slug}\\?version=${encodeURIComponent(skill.version)}`));
  await expect(page.getByRole("heading", { name: skill.title }).first()).toBeVisible();
}

test("community catalogue flow supports publish, vote ranking, and comments", async ({ page }) => {
  const runToken = `community-${Date.now()}`;
  const version = "v1.0.0";
  const submitter = "Flow Publisher";
  const baselineSlug = `community-flow-${runToken}-baseline`;
  const baselineTitle = `Community Flow Skill ${runToken} Baseline`;
  const targetSlug = `community-flow-${runToken}-target`;
  const targetTitle = `Community Flow Skill ${runToken} Target`;
  const commenter = "社区用户";
  const comment = `这个技能很有用 ${runToken}`;

  await publishSkill(page, {
    slug: baselineSlug,
    title: baselineTitle,
    version,
    submitter,
    summary: `用于对比排序的基线 Skill ${runToken}。`,
    markdown: `# ${baselineTitle}\n\n这是当前运行的基线 Skill。`
  });
  await publishSkill(page, {
    slug: targetSlug,
    title: targetTitle,
    version,
    submitter,
    summary: `用于验证公开社区流：发布、投票、评论、排序。运行标识 ${runToken}。`,
    markdown: `# ${targetTitle}\n\n用于 Playwright 端到端测试社区互动流程。`
  });

  await page.getByRole("button", { name: /点赞/i }).click();
  await expect(page.getByText(/^1 赞$/).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=upvotes&q=${encodeURIComponent(runToken)}`);
  const upvoteRows = getCatalogueRows(page);
  await expect(upvoteRows).toHaveCount(2);
  await expect(upvoteRows.first().getByRole("link", { name: `查看 ${targetTitle} 详情` })).toBeVisible();
  await expect(upvoteRows.first()).toContainText("1 赞");

  await page.goto(`${baseUrl}/skills/${targetSlug}?version=${encodeURIComponent(version)}`);
  await page.getByLabel("姓名").fill(commenter);
  await page.getByLabel("评论内容").fill(comment);
  await page.getByRole("button", { name: "发表评论" }).click();

  const commentList = page.getByRole("list", { name: "评论列表" });
  await expect(commentList).toContainText(commenter);
  await expect(commentList).toContainText(comment);

  await page.getByRole("button", { name: /点踩/i }).click();
  await expect(page.getByText(/^1 踩$/).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=downvotes&q=${encodeURIComponent(runToken)}`);
  const downvoteRows = getCatalogueRows(page);
  await expect(downvoteRows).toHaveCount(2);
  await expect(downvoteRows.first().getByRole("link", { name: `查看 ${targetTitle} 详情` })).toBeVisible();
  await expect(downvoteRows.first()).toContainText("1 踩");
});
