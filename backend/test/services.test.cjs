const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const axios = require("axios").default;
const { GithubService } = require("../dist/github/github.service");
const { ChangelogService } = require("../dist/changelog/changelog.service");
const {
  GenerationLimitsService,
} = require("../dist/changelog/generation-limits.service");
const { HistoryService } = require("../dist/history/history.service");
const dto = {
  generationId: "00000000-0000-4000-8000-000000000001",
  repoName: "test/repo",
  commits: [
    {
      sha: "a".repeat(40),
      message: "feat: endpoint\n\nBREAKING CHANGE: remove v1",
    },
  ],
};
const config = { get: () => undefined };

test("GitHub reads later commit pages and reports truncation at 500", async () => {
  const original = axios.create;
  const pages = [];
  try {
    axios.create = () => ({
      get: async (_path, { params }) => {
        pages.push(params.page);
        return {
          data: Array.from({ length: 100 }, (_, i) => ({
            sha: `${params.page}-${i}`,
            commit: { message: "fix: item" },
            html_url: "",
          })),
          headers: { link: '<next>; rel="next"' },
        };
      },
    });
    const result = await new GithubService().listCommits("token", {
      repo: "test/repo",
    });
    assert.equal(result.items.length, 500);
    assert.equal(result.truncated, true);
    assert.deepEqual(pages, [1, 2, 3, 4, 5]);
    axios.create = () => ({
      get: async (_path, { params }) => ({
        data: [{ sha: "last", commit: { message: "fix: last" } }],
        headers: params.page === 1 ? { link: '<next>; rel="next"' } : {},
      }),
    });
    assert.equal(
      (await new GithubService().listCommits("token", { repo: "test/repo" }))
        .items.length,
      2,
    );
  } finally {
    axios.create = original;
  }
});
test("persistence fails honestly and retries cannot duplicate or overwrite another owner", async () => {
  await assert.rejects(
    new ChangelogService(config, { db: null }).save("alice", dto, "draft"),
  );
  const rows = new Map();
  let fail = true;
  const db = {
    from: () => {
      let id, user;
      const chain = {
        upsert: async (row) => {
          if (fail) return { error: { message: "offline" } };
          if (!rows.has(row.id)) rows.set(row.id, row);
          return {};
        },
        select: () => chain,
        eq: (key, value) => {
          if (key === "id") id = value;
          if (key === "user_id") user = value;
          return chain;
        },
        maybeSingle: async () => ({
          data: rows.get(id)?.user_id === user ? rows.get(id) : null,
        }),
      };
      return chain;
    },
  };
  const service = new ChangelogService(config, { db });
  await assert.rejects(service.save("alice", dto, "draft"));
  fail = false;
  assert.equal(await service.save("alice", dto, "draft"), dto.generationId);
  await service.save("alice", dto, "draft");
  assert.equal(rows.size, 1);
  await assert.rejects(service.save("bob", dto, "stolen"));
  assert.equal(rows.get(dto.generationId).content, "draft");
});
test("model receives commit bodies, output cap and abort signal; truncated output fails", async () => {
  const service = new ChangelogService(config, { db: null });
  const controller = new AbortController();
  let aborted = false;
  service.openai = {
    chat: {
      completions: {
        create: async (request, options) => {
          assert.match(request.messages[1].content, /BREAKING CHANGE/);
          assert.equal(request.max_completion_tokens, 4096);
          assert.equal(options.signal, controller.signal);
          return {
            controller: {
              abort: () => {
                aborted = true;
              },
            },
            async *[Symbol.asyncIterator]() {
              yield {
                choices: [
                  { delta: { content: "draft" }, finish_reason: "length" },
                ],
              };
            },
          };
        },
      },
    },
  };
  await assert.rejects(async () => {
    for await (const delta of service.generateStream(dto, controller.signal))
      void delta;
  });
  assert.equal(aborted, true);
  assert.throws(() =>
    service.validateInput({
      ...dto,
      commits: [{ message: "x".repeat(60001) }],
    }),
  );
  assert.throws(() =>
    service.validateInput({
      ...dto,
      dateFrom: "2026-02-02",
      dateTo: "2026-01-01",
    }),
  );
});
test("generation admission fails closed for quota, duplicate and storage errors", async () => {
  for (const [result, status] of [
    [{ data: "limit" }, 429],
    [{ data: "duplicate" }, 409],
    [{ error: {} }, 503],
    [{ data: "unexpected" }, 503],
  ]) {
    const limits = new GenerationLimitsService(
      { db: { rpc: async () => result } },
      config,
    );
    await assert.rejects(
      limits.reserve("alice", dto.generationId),
      (error) => error.getStatus() === status,
    );
  }
});
test("history list and delete always scope ownership; unknown deletes return 404", async () => {
  const filters = [];
  const chain = {
    select: () => chain,
    delete: () => chain,
    eq: (key, value) => {
      filters.push([key, value]);
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    then: (resolve) => resolve({ data: [] }),
  };
  const service = new HistoryService({ db: { from: () => chain } });
  await service.list("alice");
  await assert.rejects(
    service.remove("alice", dto.generationId),
    (error) => error.getStatus() === 404,
  );
  assert.equal(
    filters.filter(([key, value]) => key === "user_id" && value === "alice")
      .length,
    2,
  );
  await assert.rejects(
    service.list(
      "alice",
      Buffer.from('{"date":"bad","id":"injected"}').toString("base64url"),
    ),
  );
});
