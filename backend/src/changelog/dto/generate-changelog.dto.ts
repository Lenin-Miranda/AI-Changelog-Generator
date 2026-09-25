import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CommitDto {
  @Matches(/^[a-f0-9]{40}$/i) sha!: string;
  @IsString() @MinLength(1) @MaxLength(60000) message!: string;
  @IsOptional() @IsString() @MaxLength(256) author?: string;
  @IsOptional() @IsISO8601() date?: string;
}
export const CHANGELOG_STYLES = ["professional", "concise", "playful"] as const;
export type ChangelogStyle = (typeof CHANGELOG_STYLES)[number];
export class ChangelogMetadataDto {
  @IsUUID("4") generationId!: string;
  @Matches(/^[\w.-]+\/[\w.-]+$/) @MaxLength(256) repoName!: string;
  @IsOptional() @IsString() @MaxLength(256) branch?: string;
  @IsOptional() @IsISO8601() dateFrom?: string;
  @IsOptional() @IsISO8601() dateTo?: string;
}
export class GenerateChangelogDto extends ChangelogMetadataDto {
  @IsOptional() @IsIn(CHANGELOG_STYLES) style?: ChangelogStyle;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  commits!: CommitDto[];
}
export class SaveChangelogDto extends ChangelogMetadataDto {
  @IsString() @MinLength(1) @MaxLength(64000) content!: string;
}
