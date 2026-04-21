import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { COUPONS_KEYS } from '@/api/coupons/queries';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001/api';

/**
 * Subscribes to the server-sent events stream for coupon status changes.
 * When a coupon transitions to "done" or "paid", React Query caches are
 * invalidated so the caisse refreshes instantly without polling delay.
 */
export function useCouponEvents(stationId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    let reconnectDelay = 1_000;
    const controller = new AbortController();

    async function connect() {
      if (!active) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const url = new URL(`${BASE_URL}/coupons/events`);
        if (stationId) url.searchParams.set('stationId', String(stationId));

        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`SSE ${resp.status}`);
        }

        reconnectDelay = 1_000; // reset backoff on successful connection
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.statut === 'done' || event.statut === 'paid') {
                queryClient.invalidateQueries({ queryKey: COUPONS_KEYS.lists() });
              }
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch (err: unknown) {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return;
        // Exponential backoff capped at 30 s
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        setTimeout(connect, reconnectDelay);
      }
    }

    connect();

    return () => {
      active = false;
      controller.abort();
    };
  }, [stationId, queryClient]);
}
