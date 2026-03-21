# Bug Fixes & Edge Cases Todo

## Billing

- [x] Add `@IsPositive()` to `CreatePaiementDto.montant` — zero or negative payment currently accepted
- [x] Add coupon status check before creating facture — a coupon still in `washing`/`pending` can be paid
- [x] ~~Add `dateFin >= today` check when applying subscription discount~~ — not applicable: subscriptions are not applied as billing discounts in this codebase

## Inventory

- [x] Add `@IsInt() @Min(1)` to `CreateMouvementStockDto.quantite` — negative quantity on `sortie` increases stock
- [x] Add pre-check that stock won't go negative on `sortie` — read stock with SELECT FOR UPDATE, refuse if insufficient
- [x] Fix `generateCommandeNumero()` race condition — use DB sequence or serializable transaction with lock

## Wash Operations / Coupons

- [x] Add coupon status transition guard in `updateCouponStatus` — any status can currently transition to any other (e.g., `paid → pending`)
- [x] Change `addServicesToCoupon` wrong-status error from `NotFoundException` (404) to `BadRequestException` (400)
- [x] Add check that assigned washers belong to the coupon's station in `assignWashers`

## Bonds

- [x] Fix `generateBonCode()` race condition — wrap uniqueness check + create inside a serializable transaction

## Reservations

- [x] Add status transition guard in `update()` — any status can transition to any other (e.g., `cancelled → confirmed`)
- [x] Add double-booking prevention — check for overlapping reservations on same vehicle before creating
- [x] Fix `generateNumero()` race condition — same pattern as inventory's order number generation

## Marketing

- [x] ~~Implement `usedCount` increment~~ — already incremented atomically in `createNouveauLavage` transaction
- [x] Guard `sendCampaign()` against re-sending — no check for `campaign.status === Sent`, sends all SMS twice if called again

## Commercial

- [x] Fix `registerVehicle` TOCTOU — duplicate-plate check and `create` wrapped in serializable transaction
- [x] Limit duplicate check to registrations from the last 7 days to prevent stale pending records blocking new ones

## Users

- [x] ~~Fix `liftSanction`~~ — already correctly re-activates user when no other blocking sanctions remain
- [x] ~~Last-SuperAdmin guard~~ — `actif` is not in `UpdateUserDto`; suspending SuperAdmins is already blocked in `createSanction`

## Auth

- [x] Add brute-force protection on login endpoint using `@nestjs/throttler` (5 attempts/min)
- [ ] Shorten JWT TTL and implement refresh token mechanism (or document the risk) — deferred, no action for now

## Stations

- [x] Add duplicate station name check (unique constraint on `nom` or pre-create validation)
- [ ] Add guard before deactivating a station — check for active coupons, open fiches, pending reservations — deferred

## Incidents

- [x] Add status transition guard — resolved incidents can freely revert to any previous status
- [x] Clear `resolvedAt` when an incident is moved away from `Resolved` status

## Audit / Logging

- [x] ~~Sanitize `requestBody`~~ — already handled by `AuditInterceptor` (SENSITIVE_FIELDS list + EXCLUDED_ROUTES)
- [ ] Add a scheduled cleanup job to archive/delete audit logs older than a configurable retention period — deferred

## Dashboard

- [x] Add `startDate <= endDate` validation in `parseDateRange` — invalid range currently returns empty data silently
