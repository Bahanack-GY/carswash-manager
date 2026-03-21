import { useRef, useCallback } from 'react'

/** Generates a compact unique key without an external dependency */
function newKey(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Returns a stable idempotency key for a single "action session".
 * The key stays the same across retries (network failures) so the server
 * can deduplicate them. Call `resetKey()` after a confirmed success to
 * get a fresh key for the next independent action.
 */
export function useIdempotencyKey() {
  const keyRef = useRef(newKey())
  const resetKey = useCallback(() => { keyRef.current = newKey() }, [])
  return { idempotencyKey: keyRef, resetKey }
}

/**
 * Injects the idempotency key as a request header.
 * Pass the result of `idempotencyKey.current` as the `key` argument.
 */
export function withIdempotency(key: string) {
  return { headers: { 'Idempotency-Key': key } }
}
