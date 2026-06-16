import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';
import { ListCommitsDto } from './dto/list-commits.dto';
import { GithubToken } from '../common/github-token.decorator';

@Controller('github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('repos')
  listRepos(@GithubToken() token: string) {
    return this.github.listRepos(token);
  }

  @Get('commits')
  listCommits(@GithubToken() token: string, @Query() query: ListCommitsDto) {
    return this.github.listCommits(token, query);
  }
}
