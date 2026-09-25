import { GenerationLimitsService } from "./generation-limits.service";
import { GithubModule } from "../github/github.module";
import { Module } from "@nestjs/common";
import { ChangelogService } from "./changelog.service";
import { ChangelogController } from "./changelog.controller";

@Module({
  imports: [GithubModule],
  controllers: [ChangelogController],
  providers: [ChangelogService, GenerationLimitsService],
})
export class ChangelogModule {}
