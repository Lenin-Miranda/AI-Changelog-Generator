import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the GitHub access token from the `Authorization: Bearer <token>`
 * header. The frontend forwards the NextAuth-stored GitHub token on every call.
 */
export const GithubToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers['authorization'];

    if (!header || Array.isArray(header) || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing GitHub access token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Empty GitHub access token');
    }
    return token;
  },
);
