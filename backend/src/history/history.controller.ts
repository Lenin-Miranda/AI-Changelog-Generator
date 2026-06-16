import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  list(@Query('userId') userId?: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.history.list(userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('userId') userId?: string) {
    if (!userId) throw new BadRequestException('userId is required');
    await this.history.remove(userId, id);
    return { deleted: true };
  }
}
