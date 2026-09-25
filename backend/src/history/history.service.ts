import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SupabaseService } from "../common/supabase.service";

export interface ChangelogRecord {
  id: string;
  user_id: string;
  repo_name: string;
  branch: string | null;
  date_from: string | null;
  date_to: string | null;
  content: string;
  created_at: string;
}

@Injectable()
export class HistoryService {
  constructor(private readonly supabase: SupabaseService) {}

  private db() {
    const db = this.supabase.db;
    if (!db) {
      throw new ServiceUnavailableException("History store is not configured");
    }
    return db;
  }

  async list(
    userId: string,
    cursor?: string,
  ): Promise<{ items: ChangelogRecord[]; nextCursor: string | null }> {
    let query = this.db()
      .from("changelogs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(51);
    if (cursor) {
      try {
        if (cursor.length > 512) throw new Error();
        const value = JSON.parse(Buffer.from(cursor, "base64url").toString());
        if (
          typeof value.date !== "string" ||
          typeof value.id !== "string" ||
          !/^[a-f0-9-]{36}$/i.test(value.id)
        )
          throw new Error();
        if (
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
            value.date,
          ) ||
          !Number.isFinite(Date.parse(value.date))
        )
          throw new Error();
        // Preserve Postgres microseconds so keyset pagination never skips ties.
        const date = value.date;
        query = query.or(
          `created_at.lt.${date},and(created_at.eq.${date},id.lt.${value.id})`,
        );
      } catch {
        throw new BadRequestException("Invalid history cursor.");
      }
    }
    const { data, error } = await query;
    if (error)
      throw new InternalServerErrorException(
        "Could not load history. Please try again.",
      );
    const rows = (data ?? []) as ChangelogRecord[];
    const items = rows.slice(0, 50);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > 50 && last
          ? Buffer.from(
              JSON.stringify({ date: last.created_at, id: last.id }),
            ).toString("base64url")
          : null,
    };
  }

  /** Deletes a record only if it belongs to the requesting user. */
  async remove(userId: string, id: string): Promise<void> {
    const { data, error } = await this.db()
      .from("changelogs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error)
      throw new InternalServerErrorException(
        "Could not delete this changelog.",
      );
    if (!data?.length) throw new NotFoundException("Changelog not found.");
  }
}
