import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentStation = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.stationId ? Number(request.stationId) : undefined;
  },
);
