import { Body, Controller, Logger, Post, Req, Res } from "@nestjs/common";
import { Response } from "express";
import { AuthenticatedRequest } from "../common/auth.guard";
import { GithubService } from "../github/github.service";
import { ChangelogService } from "./changelog.service";
import { GenerationLimitsService } from "./generation-limits.service";
import {
  GenerateChangelogDto,
  SaveChangelogDto,
} from "./dto/generate-changelog.dto";

@Controller("changelog")
export class ChangelogController {
  private readonly logger = new Logger(ChangelogController.name);
  constructor(
    private readonly changelog: ChangelogService,
    private readonly github: GithubService,
    private readonly limits: GenerationLimitsService,
  ) {}

  @Post("save")
  async save(@Body() dto: SaveChangelogDto, @Req() req: AuthenticatedRequest) {
    await this.github.assertRepoAccess(req.identity.token, dto.repoName);
    const id = await this.changelog.save(req.identity.userId, dto, dto.content);
    return { saved: true, id };
  }

  @Post("generate")
  async generate(
    @Body() dto: GenerateChangelogDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.changelog.validateInput(dto);
    await this.github.assertRepoAccess(req.identity.token, dto.repoName);
    await this.limits.reserve(req.identity.userId, dto.generationId);
    const started = Date.now();
    const abort = new AbortController();
    const disconnected = () => abort.abort();
    res.once("close", disconnected);
    if (req.aborted || res.destroyed) abort.abort();
    const timeout = setTimeout(() => abort.abort(), 120000);
    const send = (event: string, data: unknown) => {
      if (!res.destroyed)
        res.write(
          `${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(data)}\n\n`,
        );
    };
    let outcome = "incomplete";
    try {
      abort.signal.throwIfAborted();
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      let full = "";
      for await (const delta of this.changelog.generateStream(
        dto,
        abort.signal,
      )) {
        abort.signal.throwIfAborted();
        full += delta;
        if (full.length > 64000)
          throw new Error("Draft exceeded the output limit.");
        send("", { delta });
      }
      abort.signal.throwIfAborted();
      if (!full.trim()) throw new Error("The model returned an empty draft.");
      try {
        const id = await this.changelog.save(req.identity.userId, dto, full);
        send("done", { saved: true, id });
        outcome = "saved";
      } catch {
        send("done", {
          saved: false,
          id: dto.generationId,
          message:
            "Your draft is complete, but saving failed. Retry saving without generating again.",
        });
        outcome = "save_failed";
      }
    } catch {
      send("error", {
        message: abort.signal.aborted
          ? "Generation was stopped or timed out. This draft is incomplete."
          : "Generation did not finish. This draft is incomplete; please try a smaller range.",
      });
    } finally {
      clearTimeout(timeout);
      abort.abort();
      res.off("close", disconnected);
      res.end();
      await this.limits
        .release(req.identity.userId, dto.generationId)
        .catch(() => undefined);
      this.logger.log(
        JSON.stringify({
          event: "generation_finished",
          id: dto.generationId,
          outcome,
          durationMs: Date.now() - started,
        }),
      );
    }
  }
}
