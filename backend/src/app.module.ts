import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './common/supabase.module';
import { GithubModule } from './github/github.module';
import { ChangelogModule } from './changelog/changelog.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    GithubModule,
    ChangelogModule,
    HistoryModule,
  ],
})
export class AppModule {}
