import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants/roles.enum.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class StationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true; // Let JwtAuthGuard handle unauthenticated

    const stationId = request.headers['x-station-id'];
    if (!stationId) return true; // No station context required

    request.stationId = Number(stationId);

    // SuperAdmin can access any station
    if (user.role === Role.SuperAdmin) return true;

    // Users with globalAccess can access any station
    if (user.globalAccess) return true;

    // Check if user has an active affectation for this station
    if (user.stationIds && Array.isArray(user.stationIds)) {
      return user.stationIds.includes(Number(stationId));
    }

    return true;
  }
}
