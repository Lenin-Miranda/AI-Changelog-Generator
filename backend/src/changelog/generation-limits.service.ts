import {
  ConflictException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../common/supabase.service";
@Injectable()
export class GenerationLimitsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}
  async reserve(userId: string, id: string): Promise<void> {
    if (!this.supabase.db)
      throw new ServiceUnavailableException(
        "Generation storage is unavailable.",
      );
    const { data, error } = await this.supabase.db.rpc("reserve_generation", {
      request_id: id,
      owner_id: userId,
      user_limit: this.config.get<number>("GENERATION_USER_DAILY_LIMIT") ?? 10,
      global_limit:
        this.config.get<number>("GENERATION_GLOBAL_DAILY_LIMIT") ?? 100,
    });
    if (error)
      throw new ServiceUnavailableException(
        "Generation limits are unavailable. Please try later.",
      );
    if (data === "duplicate")
      throw new ConflictException(
        "This generation was already requested. Retry saving the existing draft.",
      );
    if (data === "limit")
      throw new HttpException(
        "Generation limit reached or another draft is running. Please try later.",
        429,
      );
    if (data !== "ok")
      throw new ServiceUnavailableException(
        "Generation limits are unavailable.",
      );
  }
  async release(userId: string, id: string) {
    // The lease expires automatically if the server or storage goes away.
    await this.supabase.db
      ?.from("generation_requests")
      .update({ active_until: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
  }
}
