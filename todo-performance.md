# Performance Fixes Todo

## Backend

### Database Indexes
- [x] Add indexes to `affectation` model — `userId`, `stationId`, `statut`
- [x] Add indexes to `performance` model — composite `(userId, stationId, date)`, individual `stationId`, `date`
- [x] Add indexes to `paiement` model — composite `(stationId, type, createdAt)`, individual `createdAt`
- [x] Add indexes to `fiche-piste` model — composite `(stationId, date)`, `statut`, individual FK columns
- [x] Add indexes to `coupon` model — `fichePisteId`, `statut`
- [x] Add indexes to `reservation` model — `stationId`, `statut`, `clientId`
- [x] Add indexes to `client` model — `stationId`, `commercialId`
- [x] Add indexes to `mouvement-stock` model — `produitId`, `userId`
- [x] Add indexes to `incident` model — `stationId`, `statut`
- [x] Add indexes to `sanction` model — `userId`, `statut`
- [x] Add indexes to `promotion` model — `userId`
- [x] Add indexes to `bon-lavage` model — `stationId`, `isUsed`

### N+1 / Query Optimization
- [x] `clients.service.ts: findAll()` — correlated subqueries run in 1 SQL call; indexes cover performance
- [x] `marketing.service.ts: getClients()` — correlated subqueries run in 1 SQL call; indexes cover performance
- [x] `marketing.service.ts: sendCampaign()` — batched sent recipients (1 UPDATE), parallel failed updates
- [x] `dashboard.service.ts: getTopPerformers()` — already uses batch aggregate + single user fetch
- [x] `dashboard.service.ts: getGlobalTopPerformers()` — already uses batch aggregate + single user/station fetch

### Over-fetching
- [x] `users.service.ts: findOne()` — nested User includes already restrict to `['id', 'nom', 'prenom']`
- [x] `marketing.service.ts: sendCampaign()` — Client attributes already restricted to `['id', 'nom', 'pointsFidelite']`

### Unpaginated Queries
- [ ] `marketing.service.ts: exportClients()` — replace `limit: 100000` with batched streaming

### Long Transactions
- [x] `wash-operations.service.ts: createNouveauLavage()` — TypeLavage and ServiceSpecial lookups moved outside SERIALIZABLE transaction

---

## Frontend

### React Query
- [x] Add `staleTime` to all list queries — users (2m), clients (2m), reservations (1m), coupons (30s), fiches-piste (30s), stations (5m), inventory (2m), billing (1m), bonds (1m), extras (5m), wash-types (5m)
- [x] Add `refetchIntervalInBackground: false` to commercial (3 queries) and incidents polling queries
- [x] `invalidateQueries` already targeted correctly across all mutations

### Bundle / Loading
- [x] Lazy-load all page routes in `App.tsx` with `React.lazy()` + `Suspense`

### Memoization
- [x] `Clients.tsx` — wrap stats loop (totalSubscribers, totalPoints, totalVehicles) + summaryCards in `useMemo`
- [x] `Employes.tsx` — wrap filtered list and performanceStats in `useMemo`
- [x] `Caisse.tsx` — wrap search filter in `useMemo`
- [x] `CouponDetail.tsx` — wrap `extraCategories` in `useMemo`, moved to component level

### Assets
- [ ] Convert `Logo.png` (426 KB) to WebP
