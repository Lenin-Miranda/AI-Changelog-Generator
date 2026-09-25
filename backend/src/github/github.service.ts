import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import axios, { AxiosError, AxiosInstance } from "axios";

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  updatedAt: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface CommitQuery {
  repo: string; // "owner/name"
  branch?: string;
  since?: string; // ISO date
  until?: string; // ISO date
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  private client(token: string): AxiosInstance {
    return axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      timeout: 15000,
    });
  }

  async identify(token: string): Promise<string> {
    try {
      const { data } = await this.client(token).get("/user");
      if (!Number.isSafeInteger(data.id) || data.id <= 0) {
        throw new HttpException(
          "Invalid GitHub identity",
          HttpStatus.UNAUTHORIZED,
        );
      }
      return String(data.id);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw this.translateError(err);
    }
  }

  async assertRepoAccess(token: string, repo: string): Promise<void> {
    try {
      await this.client(token).get(`/repos/${repo}`);
    } catch (err) {
      throw this.translateError(err);
    }
  }

  /** Lists repos the authenticated user can access, most recently pushed first. */
  async listRepos(
    token: string,
    page = 1,
  ): Promise<{ items: GithubRepo[]; nextPage: number | null }> {
    try {
      const { data, headers } = await this.client(token).get("/user/repos", {
        params: { per_page: 100, page, sort: "full_name", visibility: "all" },
      });

      const items = (data as RawRepo[]).map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        defaultBranch: r.default_branch,
        updatedAt: r.pushed_at ?? r.updated_at,
      }));
      return {
        items,
        nextPage: /rel="next"/.test(headers.link ?? "") ? page + 1 : null,
      };
    } catch (err) {
      throw this.translateError(err);
    }
  }

  /** Lists commits in a repo, optionally filtered by branch and date range. */
  async listCommits(
    token: string,
    query: CommitQuery,
  ): Promise<{ items: GithubCommit[]; truncated: boolean }> {
    const { repo, branch, since, until } = query;
    try {
      if (since && until && Date.parse(since) > Date.parse(until))
        throw new BadRequestException(
          "The end date must follow the start date.",
        );
      const items: GithubCommit[] = [];
      let more = false;
      for (let page = 1; page <= 5; page++) {
        const { data, headers } = await this.client(token).get<RawCommit[]>(
          `/repos/${repo}/commits`,
          {
            params: {
              sha: branch || undefined,
              since,
              until,
              per_page: 100,
              page,
            },
          },
        );
        items.push(
          ...data.map((c) => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author?.name ?? c.author?.login ?? "unknown",
            date: c.commit.author?.date ?? "",
            url: c.html_url,
          })),
        );
        more = /rel="next"/.test(headers.link ?? "");
        if (!more) break;
      }
      return { items, truncated: more };
    } catch (err) {
      throw this.translateError(err);
    }
  }

  /** Maps GitHub API errors into meaningful HTTP responses for the frontend. */
  private translateError(err: unknown): HttpException {
    if (err instanceof HttpException) return err;
    if (axios.isAxiosError(err)) {
      const axErr = err as AxiosError<{ message?: string }>;
      const status = axErr.response?.status;
      const remaining = axErr.response?.headers?.["x-ratelimit-remaining"];

      if (status === 401) {
        return new HttpException(
          "GitHub token is invalid or expired. Please reconnect GitHub.",
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (status === 403 && remaining === "0") {
        return new HttpException(
          "GitHub API rate limit exceeded. Try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (status === 403) {
        return new HttpException(
          "Access forbidden. The OAuth scope may not include this repository.",
          HttpStatus.FORBIDDEN,
        );
      }
      if (status === 404) {
        return new HttpException(
          "Repository not found, or it is private and the token lacks access.",
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(`GitHub API error: ${axErr.message}`);
      return new HttpException(
        axErr.response?.data?.message ?? "GitHub API request failed",
        status ?? HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error("Unexpected GitHub error", err as Error);
    return new HttpException(
      "Unexpected error contacting GitHub",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// --- Raw GitHub API shapes (only fields we use) ---
interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  pushed_at: string;
  updated_at: string;
}

interface RawCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string } | null;
}
