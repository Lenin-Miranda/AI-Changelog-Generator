import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRepos, streamChangelog, type GeneratePayload } from "../lib/api";
const payload: GeneratePayload = {
  generationId: "00000000-0000-4000-8000-000000000001",
  repoName: "owner/repo",
  commits: [{ sha: "a".repeat(40), message: "feat: welcome" }],
};
function respond(chunks: Uint8Array[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              chunks.forEach((chunk) => controller.enqueue(chunk));
              controller.close();
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
    ),
  );
}
const bytes = (text: string) => new TextEncoder().encode(text);
afterEach(() => vi.unstubAllGlobals());
describe("generation stream", () => {
  it("handles fragmented UTF-8 and CRLF, checks completion, and sends authentication", async () => {
    const data = bytes(
      `data: {"delta":"🚀 hello"}\r\n\r\nevent: done\r\ndata: {"saved":true,"id":"${payload.generationId}"}\r\n\r\n`,
    );
    respond(Array.from(data, (b) => new Uint8Array([b])));
    let content = "";
    expect(
      await streamChangelog("token", payload, (delta) => (content += delta)),
    ).toEqual({ saved: true, id: payload.generationId });
    expect(content).toBe("🚀 hello");
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer token",
    );
  });
  it("keeps a completed draft distinguishable from a failed save", async () => {
    respond([
      bytes(
        `event: done\ndata: {"saved":false,"id":"${payload.generationId}"}\n\n`,
      ),
    ]);
    expect((await streamChangelog("token", payload, () => {})).saved).toBe(
      false,
    );
  });
  it.each([
    'data: {"delta":"partial"}\n\n',
    'event: done\ndata: {"saved":true,"id":"wrong"}\n\n',
    "data: not-json\n\n",
    'event: error\ndata: {"message":"failed"}\n\n',
  ])("rejects incomplete or invalid streams: %s", async (text) => {
    respond([bytes(text)]);
    await expect(streamChangelog("token", payload, () => {})).rejects.toThrow();
  });
  it("passes cancellation to the HTTP request", async () => {
    const abort = new AbortController();
    abort.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) => {
        options.signal.throwIfAborted();
      }),
    );
    await expect(
      streamChangelog("token", payload, () => {}, abort.signal),
    ).rejects.toHaveProperty("name", "AbortError");
  });
});
it("loads repository pages beyond 100 and deduplicates results", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          items: Array.from({ length: 100 }, (_, id) => ({ id })),
          nextPage: 2,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: 100 }, { id: 99 }], nextPage: null }),
      ),
  );
  expect(await fetchRepos("token")).toHaveLength(101);
  expect(vi.mocked(fetch).mock.calls[1][0]).toContain("page=2");
});
