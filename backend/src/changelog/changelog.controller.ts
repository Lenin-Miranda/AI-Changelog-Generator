import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChangelogService } from './changelog.service';
import { GenerateChangelogDto } from './dto/generate-changelog.dto';

@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelog: ChangelogService) {}

  /**
   * Streams the generated changelog as Server-Sent Events.
   * Frame format:
   *   data: {"delta":"...text..."}\n\n   — incremental token
   *   event: done\ndata: {"saved":true}\n\n — completion
   *   event: error\ndata: {"message":"..."}\n\n — failure
   */
  @Post('generate')
  async generate(
    @Body() dto: GenerateChangelogDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let full = '';
    try {
      for await (const delta of this.changelog.generateStream(dto)) {
        full += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }

      await this.changelog.save(dto, full);
      res.write(`event: done\ndata: ${JSON.stringify({ saved: true })}\n\n`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Changelog generation failed';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
