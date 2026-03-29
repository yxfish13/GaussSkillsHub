import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const getCatalogueSkillRow = (page: Page, title: string) =>
  page
    .getByRole("list", { name: /skills 列表/i })
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: `查看 ${title} 详情` }) });

test("community catalogue flow supports publish, vote ranking, and comments", async ({ page }) => {
  const runId = Date.now();
  const slug = `community-flow-${runId}`;
  const title = `Community Flow Skill ${runId}`;
  const version = "v1.0.0";
  const submitter = "Flow Publisher";
  const commenter = "社区用户";
  const comment = `这个技能很有用 ${Date.now()}`;

  await page.goto(`${baseUrl}/submit`);
  await page.getByLabel("技能名称").fill(title);
  await page.getByLabel("唯一标识").fill(slug);
  await page.getByLabel("版本号").fill(version);
  await page.getByLabel("提交者").fill(submitter);
  await page.getByLabel("一句话简介").fill("用于验证公开社区流：发布、投票、评论、排序。");
  await page
    .getByLabel("详细介绍（Markdown）")
    .fill(`# ${title}\n\n用于 Playwright 端到端测试社区互动流程。`);
  await page.getByLabel("技能压缩包").setInputFiles({
    name: `${slug}.zip`,
    mimeType: "application/zip",
    buffer: Buffer.from("community flow bundle")
  });
  await page.getByRole("button", { name: /立即发布/i }).click();

  await expect(page).toHaveURL(new RegExp(`/skills/${slug}\\?version=${encodeURIComponent(version)}`));
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();

  await page.getByRole("button", { name: /点赞/i }).click();
  await expect(page.getByText(/^1 赞$/).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=upvotes`);
  const upvoteSkillItem = getCatalogueSkillRow(page, title);
  await expect(upvoteSkillItem).toHaveCount(1);
  await expect(upvoteSkillItem).toContainText("1 赞");

  await page.goto(`${baseUrl}/skills/${slug}?version=${encodeURIComponent(version)}`);
  await page.getByLabel("姓名").fill(commenter);
  await page.getByLabel("评论内容").fill(comment);
  await page.getByRole("button", { name: "发表评论" }).click();

  const commentList = page.getByRole("list", { name: "评论列表" });
  await expect(commentList).toContainText(commenter);
  await expect(commentList).toContainText(comment);

  await page.getByRole("button", { name: /点踩/i }).click();
  await expect(page.getByText(/^1 踩$/).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=downvotes`);
  const downvoteSkillItem = getCatalogueSkillRow(page, title);
  await expect(downvoteSkillItem).toHaveCount(1);
  await expect(downvoteSkillItem).toContainText("1 踩");
});
