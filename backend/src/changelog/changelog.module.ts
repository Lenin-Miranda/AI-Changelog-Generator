import { Module } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';

@Module({
  controllers: [ChangelogController],
  providers: [ChangelogService],
})
export class ChangelogModule {}
