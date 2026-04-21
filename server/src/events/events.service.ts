import { Injectable } from '@nestjs/common';
import { Subject, Observable, merge, interval, map, filter } from 'rxjs';

export interface CouponStatusEvent {
  couponId: number;
  statut: string;
  stationId: number | null;
}

type StreamEvent = CouponStatusEvent | { type: 'heartbeat' };

@Injectable()
export class EventsService {
  private readonly subject = new Subject<CouponStatusEvent>();

  emit(event: CouponStatusEvent): void {
    this.subject.next(event);
  }

  stream(stationId?: number): Observable<StreamEvent> {
    const events$: Observable<StreamEvent> =
      stationId != null
        ? this.subject.pipe(
            filter(
              (e) => e.stationId === stationId || e.stationId === null,
            ),
          )
        : this.subject.asObservable();

    // Keep the connection alive and flush nginx/proxy buffers
    const heartbeat$: Observable<StreamEvent> = interval(25_000).pipe(
      map(() => ({ type: 'heartbeat' as const })),
    );

    return merge(events$, heartbeat$);
  }
}
