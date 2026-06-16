import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SupabaseService } from '../common/supabase.service';
import {
  ChangelogStyle,
  CommitDto,
  GenerateChangelogDto,
} from './dto/generate-changelog.dto';

@Injectable()
export class ChangelogService {
  private readonly logger = new Logger(ChangelogService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  private client(): OpenAI {
    if (this.openai) return this.openai;
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
    return this.openai;
  }

  /**
   * Streams the changelog token-by-token. Yields text deltas; the caller is
   * responsible for SSE framing. Returns nothing — use the accumulated text
   * for persistence via `save()`.
   */
  async *generateStream(dto: GenerateChangelogDto): AsyncGenerator<string> {
    const prompt = this.buildPrompt(dto);

    const stream = await this.client().chat.completions.create({
      // Swap point: to use Claude instead, replace this OpenAI call with the
      // Anthropic SDK (model e.g. "claude-haiku-4-5") — the prompt is identical.
      model: 'gpt-4o-mini',
      stream: true,
      temperature: 0.4,
      messages: [
        { role: 'system', content: this.systemPrompt(dto.style ?? 'professional') },
        { role: 'user', content: prompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  /** Persists a finished changelog to Supabase. No-op if Supabase is unset. */
  async save(dto: GenerateChangelogDto, content: string): Promise<void> {
    const db = this.supabase.db;
    if (!db) return;

    const { error } = await db.from('changelogs').insert({
      user_id: dto.userId,
      repo_name: dto.repoName,
      branch: dto.branch ?? null,
      date_from: dto.dateFrom ?? null,
      date_to: dto.dateTo ?? null,
      content,
    });

    if (error) {
      this.logger.error(`Failed to save changelog: ${error.message}`);
    }
  }

  private systemPrompt(style: ChangelogStyle): string {
    const tone = {
      professional: 'clear, professional, product-release tone',
      concise: 'terse, scannable, minimal prose',
      playful: 'friendly and lightly playful, but still informative',
    }[style];

    return [
      'You are a professional developer changelog writer.',
      `Write in a ${tone}.`,
      'Output GitHub-flavored Markdown only — no preamble, no code fences around the whole thing.',
      'Use these sections, omitting any that have no entries:',
      '## 🚀 New Features',
      '## 🐛 Bug Fixes',
      '## 🔧 Improvements',
      '## 💥 Breaking Changes',
      'Rules:',
      '- Group related commits into single bullet points.',
      '- Use clear, non-technical language when possible.',
      '- Ignore merge commits and chore/ci commits.',
      '- Be concise but descriptive.',
    ].join('\n');
  }

  private buildPrompt(dto: GenerateChangelogDto): string {
    const commitList = dto.commits
      .map((c) => `- ${this.firstLine(c)}`)
      .join('\n');

    return [
      `Repository: "${dto.repoName}"${dto.branch ? ` (branch: ${dto.branch})` : ''}`,
      '',
      'Commits:',
      commitList,
    ].join('\n');
  }

  private firstLine(c: CommitDto): string {
    return c.message.split('\n')[0].trim();
  }
}
