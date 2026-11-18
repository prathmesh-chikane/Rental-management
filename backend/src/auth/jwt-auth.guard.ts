import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isValidObjectId } from 'mongoose';

type JwtPayload = {
  organizationId?: unknown;
};

type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: { organizationId: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A valid bearer access token is required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(authorization.slice(7));
    } catch {
      throw new UnauthorizedException('The access token is invalid or expired');
    }

    if (typeof payload.organizationId !== 'string' || !isValidObjectId(payload.organizationId)) {
      throw new ForbiddenException('The authenticated account is not associated with an organization');
    }

    request.user = { organizationId: payload.organizationId };
    return true;
  }
}
