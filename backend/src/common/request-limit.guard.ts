import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
@Injectable()
export class RequestLimitGuard implements CanActivate {
  private readonly windows = new Map<
    string,
    { count: number; until: number }
  >();
  canActivate(context: ExecutionContext) {
    const now = Date.now();
    for (const [key, value] of this.windows)
      if (value.until <= now) this.windows.delete(key);
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? request.socket.remoteAddress ?? "unknown";
    let window = this.windows.get(key);
    if (!window) {
      if (this.windows.size >= 10000)
        throw new HttpException("Server busy. Try again shortly.", 503);
      window = { count: 0, until: now + 60000 };
      this.windows.set(key, window);
    }
    if (++window.count > 120)
      throw new HttpException("Too many requests. Try again in a minute.", 429);
    return true;
  }
}
