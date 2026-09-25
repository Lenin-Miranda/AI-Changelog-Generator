import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from "@nestjs/common";
import { GithubService } from "./github.service";
import { ListCommitsDto } from "./dto/list-commits.dto";
import { GithubToken } from "../common/github-token.decorator";

@Controller("github")
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get("repos")
  listRepos(
    @GithubToken() token: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    if (page < 1 || page > 100)
      throw new BadRequestException("Page must be between 1 and 100.");
    return this.github.listRepos(token, page);
  }

  @Get("commits")
  listCommits(@GithubToken() token: string, @Query() query: ListCommitsDto) {
    return this.github.listCommits(token, query);
  }
}
