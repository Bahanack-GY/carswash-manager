import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class StationScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const stationId = request.headers['x-station-id'];

    if (stationId) {
      request.stationId = Number(stationId);
      if (request.body && typeof request.body === 'object') {
        request.body.stationId = Number(stationId);
      }
    }

    return next.handle();
  }
}
