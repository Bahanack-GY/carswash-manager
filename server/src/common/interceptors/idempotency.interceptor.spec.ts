import { of, throwError } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeContext(method: string, key?: string) {
    let statusCode = 201;
    const res = {
        get statusCode() { return statusCode; },
        status(code: number) { statusCode = code; return this; },
    };
    const req = {
        method,
        headers: key ? { 'idempotency-key': key } : {},
    };
    return {
        switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
        }),
    } as any;
}

function makeHandler(body: unknown, error?: Error) {
    return {
        handle: () => (error ? throwError(() => error) : of(body)),
    } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('IdempotencyInterceptor', () => {
    let interceptor: IdempotencyInterceptor;

    beforeEach(() => {
        interceptor = new IdempotencyInterceptor();
    });

    // ─── Pass-through cases ───────────────────────────────────────────────

    it('passes through GET requests without caching', (done) => {
        const ctx = makeContext('GET', 'key-1');
        const handler = makeHandler({ id: 1 });

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ id: 1 });
                done();
            },
        });
    });

    it('passes through DELETE requests without caching', (done) => {
        const ctx = makeContext('DELETE', 'key-del');
        const handler = makeHandler({ deleted: true });

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ deleted: true });
                done();
            },
        });
    });

    it('passes through POST with no idempotency key', (done) => {
        const ctx = makeContext('POST'); // no key
        const handler = makeHandler({ id: 42 });

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ id: 42 });
                done();
            },
        });
    });

    it('passes through if key exceeds 128 characters', (done) => {
        const longKey = 'a'.repeat(129);
        const ctx = makeContext('POST', longKey);
        const handler = makeHandler({ id: 1 });

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ id: 1 });
                done();
            },
        });
    });

    // ─── First request caching ────────────────────────────────────────────

    it('executes handler on first POST and caches response', (done) => {
        const ctx = makeContext('POST', 'post-key-1');
        const handlerFn = jest.fn().mockReturnValue(of({ id: 10 }));
        const handler = { handle: handlerFn };

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ id: 10 });
                expect(handlerFn).toHaveBeenCalledTimes(1);
                done();
            },
        });
    });

    it('executes handler on first PATCH and caches response', (done) => {
        const ctx = makeContext('PATCH', 'patch-key-1');
        const handlerFn = jest.fn().mockReturnValue(of({ updated: true }));
        const handler = { handle: handlerFn };

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ updated: true });
                expect(handlerFn).toHaveBeenCalledTimes(1);
                done();
            },
        });
    });

    it('executes handler on first PUT and caches response', (done) => {
        const ctx = makeContext('PUT', 'put-key-1');
        const handlerFn = jest.fn().mockReturnValue(of({ replaced: true }));
        const handler = { handle: handlerFn };

        interceptor.intercept(ctx, handler).subscribe({
            next: (val) => {
                expect(val).toEqual({ replaced: true });
                expect(handlerFn).toHaveBeenCalledTimes(1);
                done();
            },
        });
    });

    // ─── Duplicate request deduplication ─────────────────────────────────

    it('returns cached response on duplicate POST — handler called only once', (done) => {
        const key = 'dup-post-1';
        const handlerFn = jest.fn().mockReturnValue(of({ id: 99 }));
        const handler = { handle: handlerFn };

        // First call
        interceptor.intercept(makeContext('POST', key), handler).subscribe({
            next: () => {
                // Second call with same key
                interceptor.intercept(makeContext('POST', key), handler).subscribe({
                    next: (val) => {
                        expect(val).toEqual({ id: 99 });
                        expect(handlerFn).toHaveBeenCalledTimes(1); // NOT called again
                        done();
                    },
                });
            },
        });
    });

    it('returns cached response on third duplicate — handler still called only once', (done) => {
        const key = 'triple-dup';
        let calls = 0;
        const handlerFn = jest.fn().mockImplementation(() => {
            calls++;
            return of({ calls });
        });
        const handler = { handle: handlerFn };

        interceptor.intercept(makeContext('POST', key), handler).subscribe({
            next: () => {
                interceptor.intercept(makeContext('POST', key), handler).subscribe({
                    next: () => {
                        interceptor.intercept(makeContext('POST', key), handler).subscribe({
                            next: (val: any) => {
                                expect(val.calls).toBe(1);
                                expect(handlerFn).toHaveBeenCalledTimes(1);
                                done();
                            },
                        });
                    },
                });
            },
        });
    });

    it('preserves the original status code in cached response', (done) => {
        const key = 'status-key';
        let capturedStatus = 0;

        // First request: simulate 201 Created
        const ctx1 = makeContext('POST', key);
        interceptor.intercept(ctx1, makeHandler({ id: 1 })).subscribe({
            next: () => {
                // Second request: check that returned status is same
                const ctx2 = makeContext('POST', key);
                interceptor.intercept(ctx2, makeHandler({ id: 2 })).subscribe({
                    next: () => {
                        capturedStatus = ctx2.switchToHttp().getResponse().statusCode;
                        expect(capturedStatus).toBe(201);
                        done();
                    },
                });
            },
        });
    });

    it('different keys are independent — both execute the handler', (done) => {
        const handlerFn = jest.fn().mockReturnValue(of({ ok: true }));
        const handler = { handle: handlerFn };

        interceptor.intercept(makeContext('POST', 'key-A'), handler).subscribe({
            next: () => {
                interceptor.intercept(makeContext('POST', 'key-B'), handler).subscribe({
                    next: () => {
                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        done();
                    },
                });
            },
        });
    });

    // ─── Error handling ───────────────────────────────────────────────────

    it('does NOT cache on handler error — retry executes handler again', (done) => {
        const key = 'error-key';
        let callCount = 0;
        const handlerFn = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return throwError(() => new Error('DB error'));
            return of({ id: 1 });
        });
        const handler = { handle: handlerFn };

        // First call — should error
        interceptor.intercept(makeContext('POST', key), handler).subscribe({
            error: () => {
                // Second call — should succeed (handler is called again, not cached)
                interceptor.intercept(makeContext('POST', key), handler).subscribe({
                    next: (val) => {
                        expect(val).toEqual({ id: 1 });
                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        done();
                    },
                });
            },
        });
    });

    // ─── TTL expiry ───────────────────────────────────────────────────────

    it('re-executes handler after TTL expiry', (done) => {
        const key = 'ttl-key';
        let callCount = 0;
        const handlerFn = jest.fn().mockImplementation(() => {
            callCount++;
            return of({ call: callCount });
        });
        const handler = { handle: handlerFn };

        // First call — caches entry
        interceptor.intercept(makeContext('POST', key), handler).subscribe({
            next: () => {
                // Manually expire the cached entry
                const store: Map<string, any> = (interceptor as any).store;
                const entry = store.get(key)!;
                store.set(key, { ...entry, expiresAt: Date.now() - 1 }); // expired

                // Second call — cache is expired, handler runs again
                interceptor.intercept(makeContext('POST', key), handler).subscribe({
                    next: (val: any) => {
                        expect(val.call).toBe(2);
                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        done();
                    },
                });
            },
        });
    });

    it('deletes expired entry from store after it is accessed', (done) => {
        const key = 'cleanup-key';
        const handler = { handle: jest.fn().mockReturnValue(of({ x: 1 })) };

        interceptor.intercept(makeContext('POST', key), handler).subscribe({
            next: () => {
                const store: Map<string, any> = (interceptor as any).store;
                store.set(key, { ...store.get(key)!, expiresAt: Date.now() - 1 });

                interceptor.intercept(makeContext('POST', key), makeHandler({ x: 2 })).subscribe({
                    next: () => {
                        // Old expired key replaced by fresh entry for the new call
                        expect(store.has(key)).toBe(true);
                        expect(store.get(key).body).toEqual({ x: 2 });
                        done();
                    },
                });
            },
        });
    });

    // ─── Key length boundary ──────────────────────────────────────────────

    it('accepts a key of exactly 128 characters', (done) => {
        const key = 'b'.repeat(128);
        const handlerFn = jest.fn().mockReturnValue(of({ ok: true }));
        interceptor.intercept(makeContext('POST', key), { handle: handlerFn }).subscribe({
            next: () => {
                // Duplicate should be deduplicated
                interceptor.intercept(makeContext('POST', key), { handle: handlerFn }).subscribe({
                    next: () => {
                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        done();
                    },
                });
            },
        });
    });

    // ─── Concurrent requests with same key ───────────────────────────────

    it('financial scenario: encaissement duplicate triggers cache hit', (done) => {
        // Simulates caissière clicking "Encaisser" twice — second should be a no-op
        const key = 'caisse-coupon-42-paid';
        let paymentsCreated = 0;
        const handlerFn = jest.fn().mockImplementation(() => {
            paymentsCreated++;
            return of({ id: paymentsCreated, montant: 10000, statut: 'paid' });
        });
        const handler = { handle: handlerFn };

        interceptor.intercept(makeContext('PATCH', key), handler).subscribe({
            next: () => {
                interceptor.intercept(makeContext('PATCH', key), handler).subscribe({
                    next: (val: any) => {
                        expect(paymentsCreated).toBe(1); // only one real payment
                        expect(val.id).toBe(1);         // cached first response
                        done();
                    },
                });
            },
        });
    });
});
