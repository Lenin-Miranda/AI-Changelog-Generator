import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Query,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../common/auth.guard";
import { HistoryService } from "./history.service";

@Controller("history")
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query("cursor") cursor?: string) {
    return this.history.list(req.identity.userId, cursor);
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.history.remove(req.identity.userId, id);
    return { deleted: true };
  }
}
