import { IsISO8601, IsOptional, IsString, Matches } from 'class-validator';

export class ListCommitsDto {
  /** "owner/name", e.g. "vercel/next.js" */
  @Matches(/^[\w.-]+\/[\w.-]+$/, {
    message: 'repo must be in "owner/name" format',
  })
  repo!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'since must be an ISO 8601 date' })
  since?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'until must be an ISO 8601 date' })
  until?: string;
}
