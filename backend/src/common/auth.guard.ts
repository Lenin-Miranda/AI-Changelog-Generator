import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { GithubService } from '../github/github.service';

export interface AuthenticatedRequest extends Request {
  identity: { userId: string; token: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly github: GithubService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get<boolean>('public', context.getHandler())) return true;
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match || match[1].length > 512) throw new UnauthorizedException('Connect GitHub to continue.');
    const token = match[1];
    // Identity comes exclusively from GitHub, never query parameters or request bodies.
    req.identity = { userId: await this.github.identify(token), token };
    return true;
  }
}
