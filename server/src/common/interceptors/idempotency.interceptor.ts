import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

interface CachedEntry {
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const IDEMPOTENT_METHODS = new Set(['POST', 'PATCH', 'PUT']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly store = new Map<string, CachedEntry>();
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    if (!IDEMPOTENT_METHODS.has(req.method)) {
      return next.handle();
    }

    const key: string | undefined = req.headers['idempotency-key'];
    if (!key || key.length > 128) {
      return next.handle();
    }

    // Purge expired entries lazily
    const now = Date.now();
    const cached = this.store.get(key);

    if (cached) {
      if (now < cached.expiresAt) {
        this.logger.debug(`Idempotency hit: ${key}`);
        res.status(cached.statusCode);
        return new Observable((subscriber) => {
          subscriber.next(cached.body);
          subscriber.complete();
        });
      }
      this.store.delete(key);
    }

    return next.handle().pipe(
      tap((body) => {
        this.store.set(key, {
          statusCode: res.statusCode,
          body,
          expiresAt: now + TTL_MS,
        });
      }),
    );
  }
}
