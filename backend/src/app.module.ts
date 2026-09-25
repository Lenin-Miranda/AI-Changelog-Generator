import { validateConfig } from "./common/config";
import { HealthController } from "./common/health.controller";
import { RequestLimitGuard } from "./common/request-limit.guard";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./common/auth.guard";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SupabaseModule } from "./common/supabase.module";
import { GithubModule } from "./github/github.module";
import { ChangelogModule } from "./changelog/changelog.module";
import { HistoryModule } from "./history/history.module";

@Module({
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RequestLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    SupabaseModule,
    GithubModule,
    ChangelogModule,
    HistoryModule,
  ],
})
export class AppModule {}
