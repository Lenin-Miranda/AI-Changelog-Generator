import { test, expect } from "@playwright/test";
const repo = {
  id: 1,
  name: "web",
  fullName: "example/web",
  private: true,
  description: "Test project",
  defaultBranch: "main",
  updatedAt: "2026-01-01T00:00:00Z",
};
const commit = {
  sha: "a".repeat(40),
  message: "feat: welcome\n\nBREAKING CHANGE: remove legacy login",
  author: "Example",
  date: "2026-01-01T00:00:00Z",
  url: "https://github.com/example/web",
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        user: { name: "Example User" },
        expires: "2099-01-01T00:00:00Z",
        accessToken: "fixture",
        githubId: "123",
      },
    }),
  );
  await page.route("http://127.0.0.1:3199/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/github/repos")
      return route.fulfill({ json: { items: [repo], nextPage: null } });
    if (path === "/github/commits")
      return route.fulfill({ json: { items: [commit], truncated: true } });
    if (path === "/history")
      return route.fulfill({ json: { items: [], nextCursor: null } });
    return route.fulfill({
      status: 404,
      json: { message: "Unmocked API request" },
    });
  });
});
test("filters invalidate commits and saving retries without another generation", async ({
  page,
}) => {
  let generations = 0;
  await page.route("**/changelog/generate", (route) => {
    generations++;
    const body = route.request().postDataJSON();
    expect(body.branch).toBe("release");
    expect(body.userId).toBeUndefined();
    expect(body.commits[0].message).toContain("BREAKING CHANGE");
    return route.fulfill({
      contentType: "text/event-stream",
      body: `data: {"delta":"## Changes\\n- Welcome aboard"}\n\nevent: done\ndata: ${JSON.stringify({ saved: false, id: body.generationId })}\n\n`,
    });
  });
  await page.route("**/changelog/save", (route) =>
    route.fulfill({
      json: { saved: true, id: route.request().postDataJSON().generationId },
    }),
  );
  await page.goto("/generate?repo=example/web");
  const generate = page.getByRole("button", {
    name: "Generate changelog",
    exact: true,
  });
  await page.getByRole("button", { name: "Load commits", exact: true }).click();
  await expect(generate).toBeEnabled();
  await expect(page.getByText(/more than 500 commits/)).toBeVisible();
  await page.getByLabel("Branch", { exact: true }).fill("release");
  await expect(generate).toBeDisabled();
  await page.getByRole("button", { name: "Load commits", exact: true }).click();
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByText("Welcome aboard")).toBeVisible();
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(
    page.getByText("Saved to history.", { exact: true }),
  ).toBeVisible();
  expect(generations).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("an interrupted stream stays incomplete and cannot be saved", async ({
  page,
}) => {
  await page.route("**/changelog/generate", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: 'data: {"delta":"Partial draft"}\n\n',
    }),
  );
  await page.goto("/generate?repo=example/web");
  await page.getByRole("button", { name: "Load commits", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate changelog", exact: true })
    .click();
  await expect(
    page.getByText("Incomplete draft", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry saving" })).toHaveCount(
    0,
  );
});
test("history paginates, exports and recovers from expired GitHub credentials", async ({
  page,
}) => {
  const record = {
    id: "00000000-0000-4000-8000-000000000001",
    repo_name: "example/web",
    branch: "main",
    content: "## Saved draft",
    created_at: "2026-01-01T00:00:00Z",
    date_from: null,
    date_to: null,
  };
  await page.route("http://127.0.0.1:3199/history*", (route) =>
    route.fulfill({
      json: {
        items: [
          new URL(route.request().url()).searchParams.has("cursor")
            ? {
                ...record,
                id: "00000000-0000-4000-8000-000000000002",
                repo_name: "example/older",
              }
            : record,
        ],
        nextCursor: new URL(route.request().url()).searchParams.has("cursor")
          ? null
          : "fixture",
      },
    }),
  );
  await page.goto("/history");
  await page
    .getByRole("button", { name: /example\/web/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved draft" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /download/i }).click();
  expect((await download).suggestedFilename()).toContain(".md");
  await page.getByRole("button", { name: "Load older changelogs" }).click();
  await expect(page.getByText("example/older", { exact: true })).toBeVisible();
  await page.route("http://127.0.0.1:3199/github/repos*", (route) =>
    route.fulfill({ status: 401, json: { message: "Reconnect GitHub." } }),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Reconnect GitHub" }),
  ).toBeVisible();
});
