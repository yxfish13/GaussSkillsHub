import { test, expect, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const getCatalogueSkillRow = (page: Page, title: string) =>
  page
    .getByRole("list", { name: /skills 列表/i })
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: `查看 ${title} 详情` }) });

test("a submission becomes public immediately and bundle download is available", async ({ page }) => {
  const runId = Date.now();
  const slug = `superpowers-e2e-${runId}`;
  const title = `Superpowers E2E ${runId}`;
  const initialVersion = "v1.0.0";
  const docsVersion = "v1.0.1";

  await page.goto(`${baseUrl}/submit`);
  await page.getByLabel("技能名称").fill(title);
  await page.getByLabel("唯一标识").fill(slug);
  await page.getByLabel("版本号").fill(initialVersion);
  await page.getByLabel("提交者").fill("E2E Publisher");
  await page.getByLabel("一句话简介").fill("用于测试公开发布流程的 Skill，验证版本演进与下载计数。");
  await page
    .getByLabel("详细介绍（Markdown）")
    .fill(`# ${title}\n\n第一版内容，用于验证公开发布与详情页渲染。`);
  await page.getByLabel("技能压缩包").setInputFiles({
    name: "superpowers-v1.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("superpowers v1 bundle")
  });
  await page.getByRole("button", { name: /立即发布/i }).click();

  await expect(page).toHaveURL(new RegExp(`/skills/${slug}\\?version=${encodeURIComponent(initialVersion)}`));
  await expect(page.getByRole("link", { name: /更新说明/i })).toBeVisible();

  await page.getByRole("link", { name: /更新说明/i }).click();
  await expect(page).toHaveURL(new RegExp(`/submit\\?from=${slug}.*mode=docs`));
  await expect(page.getByText(new RegExp(`你正在基于 ${initialVersion} 更新说明`))).toBeVisible();
  await expect(page.getByLabel("技能压缩包")).not.toHaveAttribute("required", "");

  await page.getByLabel("版本号").fill(docsVersion);
  await page.getByLabel("提交者").fill("E2E Publisher");
  await page
    .getByLabel("详细介绍（Markdown）")
    .fill(`# ${title}\n\n这是说明更新后的版本，用于验证复用附件也能直接公开。`);
  await page.getByRole("button", { name: /发布说明版本/i }).click();

  await expect(page).toHaveURL(new RegExp(`/skills/${slug}\\?version=${encodeURIComponent(docsVersion)}`));

  const fileResponse = page.waitForResponse(
    (response) => response.url().includes("/api/files/bundles/") && response.status() === 200,
  );
  await page.getByRole("link", { name: /下载附件/i }).click();
  await fileResponse;

  await page.reload();
  await expect(page.getByText(/1 次下载/i).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=downloads`);
  const downloadsSkillItem = getCatalogueSkillRow(page, title);
  await expect(downloadsSkillItem).toHaveCount(1);
  await expect(downloadsSkillItem).toContainText("1 次下载");
});
