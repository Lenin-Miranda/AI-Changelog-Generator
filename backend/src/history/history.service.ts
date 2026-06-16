import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';

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
      throw new ServiceUnavailableException('History store is not configured');
    }
    return db;
  }

  async list(userId: string): Promise<ChangelogRecord[]> {
    const { data, error } = await this.db()
      .from('changelogs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as ChangelogRecord[];
  }

  /** Deletes a record only if it belongs to the requesting user. */
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await this.db()
      .from('changelogs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
