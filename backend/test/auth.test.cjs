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
const {
  ValidationPipe,
  UnauthorizedException,
  ForbiddenException,
} = require("@nestjs/common");
const { AppModule } = require("../dist/app.module");
const { GithubService } = require("../dist/github/github.service");
const { SupabaseService } = require("../dist/common/supabase.service");
const { HistoryService } = require("../dist/history/history.service");
const { ChangelogService } = require("../dist/changelog/changelog.service");

// External services are isolated; requests traverse the real guard, routes and pipes.
test("private API rejects anonymous calls and derives ownership from verified identity", async () => {
  SupabaseService.prototype.onModuleInit = () => {};
  GithubService.prototype.identify = async (token) => {
    if (!["alice", "bob"].includes(token)) throw new UnauthorizedException();
    return token;
  };
  GithubService.prototype.assertRepoAccess = async (token, repo) => {
    if (repo !== "owner/allowed") throw new ForbiddenException();
  };
  HistoryService.prototype.list = async (user) => [{ user_id: user }];
  let deletedFor;
  HistoryService.prototype.remove = async (user) => {
    deletedFor = user;
  };
  let generations = 0;
  ChangelogService.prototype.generateStream = async function* () {
    generations++;
    yield "draft";
  };
  ChangelogService.prototype.save = async () => {};
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(0, "127.0.0.1");
  const base = await app.getUrl();
  try {
    for (const [method, path] of [
      ["GET", "/history?userId=bob"],
      ["DELETE", "/history/00000000-0000-4000-8000-000000000000?userId=bob"],
      ["POST", "/changelog/generate"],
      ["GET", "/github/repos"],
    ]) {
      assert.equal((await fetch(base + path, { method })).status, 401);
    }
    assert.equal(
      (
        await fetch(base + "/history", {
          headers: { Authorization: "Bearer expired" },
        })
      ).status,
      401,
    );
    const headers = {
      Authorization: "Bearer alice",
      "Content-Type": "application/json",
    };
    assert.deepEqual(
      await (await fetch(base + "/history?userId=bob", { headers })).json(),
      [{ user_id: "alice" }],
    );
    await fetch(
      base + "/history/00000000-0000-4000-8000-000000000000?userId=bob",
      { headers, method: "DELETE" },
    );
    assert.equal(deletedFor, "alice");
    const dto = {
      generationId: "00000000-0000-4000-8000-000000000001",
      repoName: "owner/allowed",
      commits: [{ sha: "a".repeat(40), message: "fix: example" }],
    };
    assert.equal(
      (
        await fetch(base + "/changelog/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({ ...dto, userId: "bob" }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + "/changelog/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({ ...dto, repoName: "owner/private" }),
        })
      ).status,
      403,
    );
    assert.equal(generations, 0);
  } finally {
    await app.close();
  }
});
