// Client-side helpers for calling the NestJS backend. The GitHub access token
// is forwarded in the Authorization header for GitHub-proxying endpoints.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Repo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  updatedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface ChangelogRecord {
  id: string;
  repo_name: string;
  branch: string | null;
  date_from: string | null;
  date_to: string | null;
  content: string;
  created_at: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    if (res.status === 401 && typeof window !== "undefined")
      window.dispatchEvent(new Event("github-session-expired"));
    throw new ApiError(
      Array.isArray(message) ? message.join(" ") : message,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchRepos(token: string): Promise<Repo[]> {
  const items: Repo[] = [];
  for (let page: number | null = 1; page !== null;) {
    if (page > 100)
      throw new Error(
        "This account has more than 10,000 repositories. Repository listing cannot be completed.",
      );
    const result: { items: Repo[]; nextPage: number | null } = await handle(
      await fetch(`${API_URL}/github/repos?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    items.push(...result.items);
    page = result.nextPage;
  }
  return Array.from(new Map(items.map((repo) => [repo.id, repo])).values());
}

export async function fetchCommits(
  token: string,
  params: { repo: string; branch?: string; since?: string; until?: string },
): Promise<{ items: Commit[]; truncated: boolean }> {
  const qs = new URLSearchParams({ repo: params.repo });
  if (params.branch) qs.set("branch", params.branch);
  if (params.since) qs.set("since", params.since);
  if (params.until) qs.set("until", params.until);
  return handle(
    await fetch(`${API_URL}/github/commits?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function fetchHistory(
  token: string,
  cursor?: string,
): Promise<{ items: ChangelogRecord[]; nextCursor: string | null }> {
  return handle(
    await fetch(
      `${API_URL}/history${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  );
}
export async function deleteHistory(token: string, id: string): Promise<void> {
  await handle(
    await fetch(`${API_URL}/history/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export interface GeneratePayload {
  generationId: string;
  repoName: string;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
  style?: "professional" | "concise" | "playful";
  commits: (Pick<Commit, "sha" | "message"> &
    Partial<Pick<Commit, "author" | "date">>)[];
}

export interface SaveResult {
  saved: boolean;
  id: string;
  message?: string;
}
export type SavePayload = Omit<GeneratePayload, "commits" | "style"> & {
  content: string;
};
export async function saveChangelog(
  token: string,
  payload: SavePayload,
): Promise<SaveResult> {
  return handle(
    await fetch(`${API_URL}/changelog/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),
  );
}

export async function streamChangelog(
  token: string,
  payload: GeneratePayload,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<SaveResult> {
  const res = await fetch(`${API_URL}/changelog/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) await handle(res);
  if (
    !res.body ||
    !res.headers.get("content-type")?.includes("text/event-stream")
  )
    throw new Error("The server did not start a changelog stream.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        throw new Error(
          "The connection ended before completion. This draft is incomplete.",
        );
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 131072) throw new Error("Invalid stream frame size.");
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const lines = frame.split(/\r?\n/);
        const event = lines
          .find((line) => line.startsWith("event:"))
          ?.slice(6)
          .trim();
        const raw = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (event === "error")
          throw new Error(data.message ?? "Generation failed.");
        if (event === "done") {
          if (
            typeof data.saved !== "boolean" ||
            data.id !== payload.generationId
          )
            throw new Error("Invalid completion response.");
          return data as SaveResult;
        }
        if (typeof data.delta === "string") onDelta(data.delta);
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
