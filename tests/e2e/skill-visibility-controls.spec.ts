import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123456";

type SkillSubmission = {
  slug: string;
  title: string;
  version: string;
  summary: string;
  markdown: string;
  submitter: string;
};

async function acceptNextDialog(page: Page, expectedMessage: string) {
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain(expectedMessage);
    await dialog.accept();
  });
}

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

async function loginAsAdmin(page: Page) {
  await page.goto(`${baseUrl}/admin/login`);
  await page.getByLabel("Username").fill(adminUsername);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Enter Admin Archive" }).click();
  await expect(page).toHaveURL(`${baseUrl}/admin`);
}

test("public hide and admin restore/delete keep hidden skills out of the public catalogue", async ({ page }) => {
  const runToken = `visibility-${Date.now()}`;
  const slug = `visibility-flow-${runToken}`;
  const title = `Visibility Flow ${runToken}`;
  const version = "v1.0.0";

  await publishSkill(page, {
    slug,
    title,
    version,
    submitter: "Visibility Publisher",
    summary: `用于测试公开下架和管理员恢复/删除流程，运行标识 ${runToken}。`,
    markdown: `# ${title}\n\n用于验证可见性控制流程。`
  });

  await page.goto(`${baseUrl}/skills?q=${encodeURIComponent(runToken)}`);
  await expect(page.getByRole("link", { name: `查看 ${title} 详情` })).toBeVisible();

  await page.goto(`${baseUrl}/skills/${slug}?version=${encodeURIComponent(version)}`);
  await acceptNextDialog(page, "确认下架后");
  await page.getByRole("button", { name: "下架这个 Skill" }).click();
  await expect(page).toHaveURL(new RegExp("/skills\\?status=hidden"));

  await page.goto(`${baseUrl}/skills?q=${encodeURIComponent(runToken)}`);
  await expect(page.getByRole("link", { name: `查看 ${title} 详情` })).toHaveCount(0);

  const hiddenResponse = await page.goto(`${baseUrl}/skills/${slug}?version=${encodeURIComponent(version)}`);
  expect(hiddenResponse?.status()).toBe(404);

  await loginAsAdmin(page);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(new RegExp("/admin/versions/"));

  await acceptNextDialog(page, "确认恢复后");
  await page.getByRole("button", { name: "恢复 Skill" }).click();
  await expect(page).toHaveURL(/status=restored/);

  await page.goto(`${baseUrl}/skills?q=${encodeURIComponent(runToken)}`);
  await expect(page.getByRole("link", { name: `查看 ${title} 详情` })).toBeVisible();

  await loginAsAdmin(page);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(new RegExp("/admin/versions/"));

  await acceptNextDialog(page, "此操作不可恢复");
  await page.getByRole("button", { name: "删除 Skill" }).click();
  await expect(page).toHaveURL(new RegExp("/admin\\?status=deleted"));

  await page.goto(`${baseUrl}/skills?q=${encodeURIComponent(runToken)}`);
  await expect(page.getByRole("link", { name: `查看 ${title} 详情` })).toHaveCount(0);

  const deletedResponse = await page.goto(`${baseUrl}/skills/${slug}?version=${encodeURIComponent(version)}`);
  expect(deletedResponse?.status()).toBe(404);
});
