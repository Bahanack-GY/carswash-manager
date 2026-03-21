import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StationsModule } from './stations/stations.module.js';
import { UsersModule } from './users/users.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { WashOperationsModule } from './wash-operations/wash-operations.module.js';
import { BillingModule } from './billing/billing.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { IncidentsModule } from './incidents/incidents.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { CommercialModule } from './commercial/commercial.module.js';
import { MarketingModule } from './marketing/marketing.module.js';
import { AuditModule } from './audit/audit.module.js';
import { BondsModule } from './bonds/bonds.module.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { StationAccessGuard } from './common/guards/station-access.guard.js';
import { StationScopeInterceptor } from './common/interceptors/station-scope.interceptor.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: Number(process.env.THROTTLE_LIMIT ?? 10),
    }]),
    DatabaseModule,
    AuthModule,
    StationsModule,
    UsersModule,
    ClientsModule,
    ReservationsModule,
    WashOperationsModule,
    BillingModule,
    InventoryModule,
    IncidentsModule,
    DashboardModule,
    CommercialModule,
    MarketingModule,
    AuditModule,
    BondsModule,
    ChatbotModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: StationAccessGuard },
    { provide: APP_INTERCEPTOR, useClass: StationScopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
