import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import {
  resolveActionLabel,
  resolveEntity,
} from '../../audit/constants/action-labels.js';

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refresh_token',
  'access_token',
  'secret',
];

const EXCLUDED_ROUTES = ['/api/auth/login', '/api/auth/refresh'];

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function sanitize(
  body: Record<string, any> | undefined,
): Record<string, any> | null {
  if (!body || typeof body !== 'object') return null;
  const cleaned = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (field in cleaned) {
      cleaned[field] = '[REDACTED]';
    }
  }
  // Prevent oversized payloads
  const json = JSON.stringify(cleaned);
  if (json.length > 10000) {
    return { _truncated: true, _size: json.length, keys: Object.keys(body) };
  }
  return cleaned;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, user, stationId } = request;

    // Skip non-mutating methods
    if (!AUDITED_METHODS.has(method)) {
      return next.handle();
    }

    // Skip excluded routes
    if (EXCLUDED_ROUTES.some((route) => url.startsWith(route))) {
      return next.handle();
    }

    // Skip public endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return next.handle();
    }

    // Prepare audit data
    const sanitizedBody = sanitize(body);
    const { entity, entityId } = resolveEntity(url);
    const actionLabel = resolveActionLabel(method, url);

    const baseLog = {
      userId: user?.id ?? null,
      userName: user ? `${user.prenom} ${user.nom}` : null,
      userRole: user?.role ?? null,
      userPhone: user?.telephone ?? null,
      action: method,
      actionLabel,
      entity,
      entityId,
      stationId: stationId ?? null,
      route: url.split('?')[0],
      requestBody: sanitizedBody,
    };

    const metaBase: Record<string, any> = {};
    if (params && Object.keys(params).length) metaBase.params = params;
    if (query && Object.keys(query).length) metaBase.query = query;
    if (request.ip) metaBase.ip = request.ip;

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.auditService
            .create({
              ...baseLog,
              statusCode: response.statusCode,
              metadata: Object.keys(metaBase).length ? metaBase : null,
            })
            .catch((err) => {
              console.error(
                '[AuditInterceptor] Failed to write audit log:',
                err.message,
              );
            });
        },
        error: (err) => {
          this.auditService
            .create({
              ...baseLog,
              statusCode: err.status ?? err.getStatus?.() ?? 500,
              metadata: {
                ...metaBase,
                error: err.message,
              },
            })
            .catch((auditErr) => {
              console.error(
                '[AuditInterceptor] Failed to write audit log:',
                auditErr.message,
              );
            });
        },
      }),
    );
  }
}
