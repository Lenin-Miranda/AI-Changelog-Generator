import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  IsISO8601,
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
  @Matches(/^[\w.-]+\/[\w.-]+$/)
  repoName!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @IsOptional()
  @IsIn(CHANGELOG_STYLES)
  style?: ChangelogStyle;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  commits!: CommitDto[];
}
