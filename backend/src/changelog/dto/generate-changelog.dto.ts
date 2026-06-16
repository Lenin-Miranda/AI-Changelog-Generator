import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CommitDto {
  @IsString()
  sha!: string;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  date?: string;
}

export const CHANGELOG_STYLES = ['professional', 'concise', 'playful'] as const;
export type ChangelogStyle = (typeof CHANGELOG_STYLES)[number];

export class GenerateChangelogDto {
  @IsString()
  repoName!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsIn(CHANGELOG_STYLES)
  style?: ChangelogStyle;

  /** GitHub user id, forwarded by the frontend for history association. */
  @IsString()
  userId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  commits!: CommitDto[];
}
