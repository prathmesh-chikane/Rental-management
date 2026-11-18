import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrganizationId = createParamDecorator(
    (_data: unknown, context: ExecutionContext): string => {
        const request = context.switchToHttp().getRequest<{ user?: { organizationId?: string } }>();
        return request.user?.organizationId ?? '';
    },
);
