import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/auth.guard';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './common/supabase.module';
import { GithubModule } from './github/github.module';
import { ChangelogModule } from './changelog/changelog.module';
import { HistoryModule } from './history/history.module';

@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    GithubModule,
    ChangelogModule,
    HistoryModule,
  ],
})
export class AppModule {}
