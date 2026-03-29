import { test, expect, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

type SkillSubmission = {
  slug: string;
  title: string;
  version: string;
  summary: string;
  markdown: string;
};

const getCatalogueRows = (page: Page) => page.getByRole("list", { name: /skills 列表/i }).getByRole("listitem");

async function publishSkill(page: Page, skill: SkillSubmission) {
  await page.goto(`${baseUrl}/submit`);
  await page.getByLabel("技能名称").fill(skill.title);
  await page.getByLabel("唯一标识").fill(skill.slug);
  await page.getByLabel("版本号").fill(skill.version);
  await page.getByLabel("提交者").fill("E2E Publisher");
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

test("a submission becomes public immediately and bundle download is available", async ({ page }) => {
  const runToken = `${Date.now()}`;
  const initialVersion = "v1.0.0";
  const docsVersion = "v1.0.1";
  const baselineSlug = `superpowers-e2e-${runToken}-baseline`;
  const baselineTitle = `Superpowers E2E ${runToken} Baseline`;
  const targetSlug = `superpowers-e2e-${runToken}-target`;
  const targetTitle = `Superpowers E2E ${runToken} Target`;

  await publishSkill(page, {
    slug: baselineSlug,
    title: baselineTitle,
    version: initialVersion,
    summary: `用于对比下载排序的基线 Skill ${runToken}。`,
    markdown: `# ${baselineTitle}\n\n这是当前运行的基线 Skill。`
  });
  await publishSkill(page, {
    slug: targetSlug,
    title: targetTitle,
    version: initialVersion,
    summary: `用于测试公开发布流程的 Skill，验证版本演进与下载计数。运行标识 ${runToken}。`,
    markdown: `# ${targetTitle}\n\n第一版内容，用于验证公开发布与详情页渲染。`
  });

  await expect(page.getByRole("link", { name: /更新说明/i })).toBeVisible();

  await page.getByRole("link", { name: /更新说明/i }).click();
  await expect(page).toHaveURL(new RegExp(`/submit\\?from=${targetSlug}.*mode=docs`));
  await expect(page.getByText(new RegExp(`你正在基于 ${initialVersion} 更新说明`))).toBeVisible();
  await expect(page.getByLabel("技能压缩包")).not.toHaveAttribute("required", "");

  await page.getByLabel("版本号").fill(docsVersion);
  await page.getByLabel("提交者").fill("E2E Publisher");
  await page
    .getByLabel("详细介绍（Markdown）")
    .fill(`# ${targetTitle}\n\n这是说明更新后的版本，用于验证复用附件也能直接公开。`);
  await page.getByRole("button", { name: /发布说明版本/i }).click();

  await expect(page).toHaveURL(new RegExp(`/skills/${targetSlug}\\?version=${encodeURIComponent(docsVersion)}`));

  const fileResponse = page.waitForResponse(
    (response) => response.url().includes("/api/files/bundles/") && response.status() === 200,
  );
  await page.getByRole("link", { name: /下载附件/i }).click();
  await fileResponse;

  await page.reload();
  await expect(page.getByText(/1 次下载/i).first()).toBeVisible();

  await page.goto(`${baseUrl}/skills?sort=downloads&q=${encodeURIComponent(runToken)}`);
  const downloadsRows = getCatalogueRows(page);
  await expect(downloadsRows).toHaveCount(2);
  await expect(downloadsRows.first().getByRole("link", { name: `查看 ${targetTitle} 详情` })).toBeVisible();
  await expect(downloadsRows.first()).toContainText("1 次下载");
});
