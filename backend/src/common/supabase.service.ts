import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createClient,
  SupabaseClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
import WebSocket from "ws";

const websocketTransport = WebSocket as unknown as WebSocketLikeConstructor;

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>("SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_KEY");

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required.");
    }
    // Service key bypasses RLS; this runs server-side only, never in the browser.
    this.client = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
              : AbortSignal.timeout(10000),
          }),
      },
      realtime: { transport: websocketTransport },
    });
  }

  /** Returns the client, or null when Supabase is not configured. */
  get db(): SupabaseClient | null {
    return this.client;
  }
}
