const { test } = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, {
  OPENAI_API_KEY: "test-only",
  SUPABASE_URL: "http://127.0.0.1:9999",
  SUPABASE_SERVICE_KEY: "test-only",
  FRONTEND_URL: "http://localhost:3000",
});
require("reflect-metadata");
const { NestFactory } = require("@nestjs/core");
const { ValidationPipe } = require("@nestjs/common");
const { AppModule } = require("../dist/app.module");
const { GithubService } = require("../dist/github/github.service");
const { SupabaseService } = require("../dist/common/supabase.service");
const { ChangelogService } = require("../dist/changelog/changelog.service");
const {
  GenerationLimitsService,
} = require("../dist/changelog/generation-limits.service");

test("save failure is recoverable, incomplete drafts are not saved, and disconnect aborts upstream", async () => {
  SupabaseService.prototype.onModuleInit = () => {};
  GithubService.prototype.identify = async () => "alice";
  GithubService.prototype.assertRepoAccess = async () => {};
  let generated = 0,
    saveCalls = 0,
    released = 0,
    upstreamAborted = false;
  let mode = "save-failure";
  GenerationLimitsService.prototype.reserve = async () => {};
  GenerationLimitsService.prototype.release = async () => {
    released++;
  };
  ChangelogService.prototype.save = async (_user, dto) => {
    saveCalls++;
    if (mode === "save-failure") throw new Error("db failed");
    return dto.generationId;
  };
  ChangelogService.prototype.generateStream = async function* (_dto, signal) {
    generated++;
    yield "partial draft";
    if (mode === "incomplete") throw new Error("provider disconnected");
    if (mode === "cancel")
      await new Promise((resolve) => {
        if (signal.aborted) {
          upstreamAborted = true;
          resolve();
          return;
        }
        signal.addEventListener(
          "abort",
          () => {
            upstreamAborted = true;
            resolve();
          },
          { once: true },
        );
      });
  };
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(0, "127.0.0.1");
  const url = await app.getUrl();
  const metadata = {
    generationId: "00000000-0000-4000-8000-000000000001",
    repoName: "test/repo",
  };
  const headers = {
    Authorization: "Bearer token",
    "Content-Type": "application/json",
  };
  const request = {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...metadata,
      commits: [{ sha: "a".repeat(40), message: "fix: item" }],
    }),
  };
  try {
    const result = await (
      await fetch(url + "/changelog/generate", request)
    ).text();
    assert.match(result, /event: done/);
    assert.match(result, /"saved":false/);
    mode = "ok";
    const saved = await (
      await fetch(url + "/changelog/save", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...metadata, content: "partial draft" }),
      })
    ).json();
    assert.equal(saved.saved, true);
    assert.equal(generated, 1);
    mode = "incomplete";
    const count = saveCalls;
    const incomplete = await (
      await fetch(url + "/changelog/generate", request)
    ).text();
    assert.match(incomplete, /event: error/);
    assert.doesNotMatch(incomplete, /event: done/);
    assert.equal(saveCalls, count);
    mode = "cancel";
    const abort = new AbortController();
    const response = await fetch(url + "/changelog/generate", {
      ...request,
      signal: abort.signal,
    });
    await response.body.getReader().read();
    abort.abort();
    for (let i = 0; i < 50 && !upstreamAborted; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(upstreamAborted, true);
    assert.equal(saveCalls, count);
    assert.equal(released, 3);
  } finally {
    await app.close();
  }
});
