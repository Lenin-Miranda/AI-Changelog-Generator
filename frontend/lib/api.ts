// Client-side helpers for calling the NestJS backend. The GitHub access token
// is forwarded in the Authorization header for GitHub-proxying endpoints.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchRepos(token: string): Promise<Repo[]> {
  const res = await fetch(`${API_URL}/github/repos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<Repo[]>(res);
}

export async function fetchCommits(
  token: string,
  params: { repo: string; branch?: string; since?: string; until?: string },
): Promise<Commit[]> {
  const qs = new URLSearchParams({ repo: params.repo });
  if (params.branch) qs.set('branch', params.branch);
  if (params.since) qs.set('since', params.since);
  if (params.until) qs.set('until', params.until);

  const res = await fetch(`${API_URL}/github/commits?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<Commit[]>(res);
}

export async function fetchHistory(token: string): Promise<ChangelogRecord[]> {
  const res = await fetch(
    `${API_URL}/history`, { headers: { Authorization: `Bearer ${token}` } },
  );
  return handle<ChangelogRecord[]>(res);
}

export async function deleteHistory(
  token: string,
  id: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/history/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  await handle<{ deleted: boolean }>(res);
}

export interface GeneratePayload {
  repoName: string;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
  style?: 'professional' | 'concise' | 'playful';
  commits: Pick<Commit, 'sha' | 'message' | 'author' | 'date'>[];
}

/**
 * Streams a changelog from the backend SSE endpoint. Calls `onDelta` for each
 * text chunk and resolves when the stream completes. Rejects on error events.
 */
export async function streamChangelog(
  token: string,
  payload: GeneratePayload,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_URL}/changelog/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    await handle(res); // throws with a useful message
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Parse the SSE stream frame by frame (frames separated by a blank line).
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const lines = frame.split('\n');
      const eventLine = lines.find((l) => l.startsWith('event:'));
      const dataLine = lines.find((l) => l.startsWith('data:'));
      if (!dataLine) continue;

      const data = JSON.parse(dataLine.slice('data:'.length).trim());
      const event = eventLine?.slice('event:'.length).trim();

      if (event === 'error') throw new Error(data.message ?? 'Generation failed');
      if (event === 'done') return;
      if (data.delta) onDelta(data.delta);
    }
  }
}
