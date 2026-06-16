import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !key) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_KEY not set — history persistence disabled.',
      );
      return;
    }
    // Service key bypasses RLS; this runs server-side only, never in the browser.
    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  /** Returns the client, or null when Supabase is not configured. */
  get db(): SupabaseClient | null {
    return this.client;
  }
}
