/**
 * Stress Test — 50 carwashes × 15 employees
 *
 * SAFE: uses only GET (read-only) endpoints → nothing is written to the DB.
 * Simulates realistic role-based workloads for each employee type.
 *
 * Each VU sends a unique X-Forwarded-For IP so per-IP rate limits
 * behave realistically (requires `trust proxy` enabled on the server).
 *
 * Usage:
 *   node stress-test.mjs
 *   node stress-test.mjs --duration=30   # run for 30 seconds (default: 20)
 *   node stress-test.mjs --rampUp=5      # seconds to ramp up VUs (default: 3)
 */

const API = 'http://localhost:3091/api';
const ADMIN_EMAIL    = 'admin@carwash.mylisapp.online';
const ADMIN_PASSWORD = 'Admin@2025!';

// ── CLI args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v]; })
);
const DURATION_MS   = Number(args.duration || 20) * 1000;
const RAMP_UP_MS    = Number(args.rampUp   ||  3) * 1000;
const STATIONS      = 50;
const EMP_PER_STATION = 15;

// ── Metrics ────────────────────────────────────────────────────────────────
const metrics = {
  total: 0, ok: 0, errors: 0,
  durations: [],
  byEndpoint: {},
  errorMessages: {},
};

function record(label, ms, ok, errMsg) {
  metrics.total++;
  metrics.durations.push(ms);
  if (ok) metrics.ok++;
  else {
    metrics.errors++;
    metrics.errorMessages[errMsg] = (metrics.errorMessages[errMsg] || 0) + 1;
  }
  const e = metrics.byEndpoint[label] ??= { count: 0, ok: 0, sum: 0, max: 0 };
  e.count++; e.sum += ms; e.max = Math.max(e.max, ms);
  if (ok) e.ok++;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length * p / 100)];
}

// ── HTTP helper ───────────────────────────────────────────────────────────
async function get(token, path, label, fakeIp) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Forwarded-For': fakeIp,
      },
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - t0;
    // 404 (station doesn't exist) and 403 (role access denied) are expected for
    // simulated stations/roles — treat as non-errors for latency purposes
    const ok = res.status < 500;
    record(label, ms, ok, ok ? '' : `HTTP ${res.status}`);
    return ok;
  } catch (e) {
    record(label, Date.now() - t0, false, e.name === 'TimeoutError' ? 'Timeout' : 'NetworkError');
    return false;
  }
}

// ── Role workloads (all GET — zero DB writes) ─────────────────────────────
function makeWorkload(token, stationId, fakeIp) {
  const s = stationId;
  const g = (path, label) => get(token, path, label, fakeIp);
  return {
    manager: () => Promise.all([
      g(`/dashboard/stats?stationId=${s}`,            'dashboard/stats'),
      g(`/dashboard/revenue?stationId=${s}`,          'dashboard/revenue'),
      g(`/dashboard/top-performers?stationId=${s}`,   'dashboard/top-performers'),
      g(`/dashboard/activity?stationId=${s}`,         'dashboard/activity'),
      g(`/users?stationId=${s}`,                      'users/list'),
      g(`/incidents?stationId=${s}`,                  'incidents/list'),
      g(`/fiches-piste?stationId=${s}&page=1&limit=20`, 'fiches-piste/list'),
    ]),
    controleur: () => Promise.all([
      g(`/fiches-piste?stationId=${s}&page=1&limit=20`, 'fiches-piste/list'),
      g(`/coupons?stationId=${s}&page=1&limit=20`,      'coupons/list'),
      g(`/clients?stationId=${s}&page=1&limit=20`,      'clients/list'),
      g(`/wash-types?stationId=${s}`,                   'wash-types/list'),
      g(`/extras?stationId=${s}`,                       'extras/list'),
      g(`/reservations?stationId=${s}&page=1&limit=20`, 'reservations/list'),
    ]),
    caissiere: () => Promise.all([
      g(`/coupons?stationId=${s}&page=1&limit=20`,               'coupons/list'),
      g(`/caisse/transactions?stationId=${s}&page=1&limit=20`,   'caisse/transactions'),
      g(`/caisse/summary?stationId=${s}`,                        'caisse/summary'),
      g(`/factures?stationId=${s}&page=1&limit=20`,              'factures/list'),
      g(`/reservations?stationId=${s}&page=1&limit=20`,          'reservations/list'),
      g(`/bonds?stationId=${s}&page=1&limit=20`,                 'bonds/list'),
    ]),
    laveur: () => Promise.all([
      g(`/coupons/my-assigned`,  'coupons/my-assigned'),
      g(`/auth/me`,              'auth/me'),
      g(`/wash-types`,           'wash-types/list'),
    ]),
    commercial: () => Promise.all([
      g(`/commercial/today?stationId=${s}`,   'commercial/today'),
      g(`/commercial/stats?stationId=${s}`,   'commercial/stats'),
      g(`/commercial/history?stationId=${s}`, 'commercial/history'),
      g(`/clients?stationId=${s}&page=1`,     'clients/list'),
    ]),
    comptable: () => Promise.all([
      g(`/caisse/summary?stationId=${s}`,                      'caisse/summary'),
      g(`/caisse/transactions?stationId=${s}&page=1&limit=20`, 'caisse/transactions'),
      g(`/factures?stationId=${s}&page=1&limit=20`,            'factures/list'),
      g(`/dashboard/revenue?stationId=${s}`,                   'dashboard/revenue'),
    ]),
  };
}

// 15 employees per station: 1 manager, 2 controleurs, 2 caissieres, 7 laveurs, 2 commerciaux, 1 comptable
const STATION_ROLES = [
  'manager',
  'controleur', 'controleur',
  'caissiere',  'caissiere',
  'laveur', 'laveur', 'laveur', 'laveur', 'laveur', 'laveur', 'laveur',
  'commercial', 'commercial',
  'comptable',
];

// ── Virtual user ──────────────────────────────────────────────────────────
async function runVU(token, stationId, role, fakeIp, startDelay, stopAt) {
  await new Promise(r => setTimeout(r, startDelay));
  const workload = makeWorkload(token, stationId, fakeIp);
  const fn = workload[role] || workload.laveur;
  while (Date.now() < stopAt) {
    await fn();
    // Think time: 300–700ms between action cycles
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Authenticating...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    process.exit(1);
  }
  const { access_token: token } = await loginRes.json();
  console.log('✓ Authenticated\n');

  // Build VU list: 50 stations × 15 employees = 750 VUs
  // Each VU gets a unique fake IP: 10.<station>.<employee>.1 → e.g. 10.1.3.1
  const vus = [];
  for (let s = 1; s <= STATIONS; s++) {
    STATION_ROLES.forEach((role, i) => {
      vus.push({
        stationId: s,
        role,
        fakeIp: `10.${s}.${i + 1}.1`,   // unique per VU
      });
    });
  }

  const totalVUs = vus.length; // 750
  console.log('📋 Test configuration:');
  console.log(`   Stations  : ${STATIONS}`);
  console.log(`   Employees : ${EMP_PER_STATION} per station (${totalVUs} total VUs)`);
  console.log(`   Duration  : ${DURATION_MS / 1000}s`);
  console.log(`   Ramp-up   : ${RAMP_UP_MS / 1000}s (VUs start gradually)`);
  console.log(`   Mode      : READ-ONLY — no DB writes\n`);

  const stopAt    = Date.now() + DURATION_MS + RAMP_UP_MS;
  const startTime = Date.now();

  // Stagger VU starts across the ramp-up window to avoid thundering herd
  const delayStep = RAMP_UP_MS / totalVUs;
  const tasks = vus.map((vu, i) =>
    runVU(token, vu.stationId, vu.role, vu.fakeIp, Math.floor(i * delayStep), stopAt)
  );

  // Progress reporter
  let lastTotal = 0;
  const progInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rps = (metrics.total / Math.max(elapsed, 0.1)).toFixed(1);
    const delta = metrics.total - lastTotal;
    lastTotal = metrics.total;
    const errPct = metrics.total > 0 ? ((metrics.errors / metrics.total) * 100).toFixed(1) : '0.0';
    const p95now = pct(metrics.durations, 95);
    process.stdout.write(
      `\r⏱  ${elapsed}s | VUs: ${totalVUs} | Reqs: ${metrics.total} (+${delta}/s) | RPS≈${rps} | p95: ${p95now}ms | Errors: ${metrics.errors} (${errPct}%)`
    );
  }, 1000);

  await Promise.all(tasks);
  clearInterval(progInterval);

  const totalSec = (Date.now() - startTime) / 1000;
  process.stdout.write('\n\n');

  // ── Results ────────────────────────────────────────────────────────────
  const d = metrics.durations;
  const avg = d.length ? (d.reduce((a, b) => a + b, 0) / d.length).toFixed(0) : 0;
  const rps  = (metrics.total / totalSec).toFixed(1);
  const errPct = metrics.total > 0 ? ((metrics.errors / metrics.total) * 100).toFixed(1) : '0.0';

  const line = '═'.repeat(62);
  const thin = '─'.repeat(62);
  console.log(line);
  console.log('  STRESS TEST RESULTS  —  50 stations × 15 employees');
  console.log(line);
  console.log(`  Total requests  : ${metrics.total}`);
  console.log(`  Successful      : ${metrics.ok}  (${(100 - Number(errPct)).toFixed(1)}%)`);
  console.log(`  Errors          : ${metrics.errors}  (${errPct}%)`);
  console.log(`  Test duration   : ${totalSec.toFixed(1)}s`);
  console.log(`  Throughput      : ${rps} req/s`);
  console.log('');
  console.log('  Response time distribution:');
  console.log(`    p50   ${pct(d, 50)}ms`);
  console.log(`    p75   ${pct(d, 75)}ms`);
  console.log(`    p90   ${pct(d, 90)}ms`);
  console.log(`    p95   ${pct(d, 95)}ms`);
  console.log(`    p99   ${pct(d, 99)}ms`);
  console.log(`    max   ${Math.max(...d)}ms`);
  console.log(`    avg   ${avg}ms`);
  console.log('');

  // Per-endpoint table
  console.log('  Per-endpoint breakdown (sorted by avg latency ↓):');
  console.log(`  ${'─'.repeat(34)} ${'─'.repeat(6)} ${'─'.repeat(6)} ${'─'.repeat(7)} ${'─'.repeat(7)}`);
  console.log(`  ${'Endpoint'.padEnd(34)} ${'Calls'.padStart(6)} ${'OK%'.padStart(6)} ${'Avg'.padStart(7)} ${'Max'.padStart(7)}`);
  console.log(`  ${'─'.repeat(34)} ${'─'.repeat(6)} ${'─'.repeat(6)} ${'─'.repeat(7)} ${'─'.repeat(7)}`);
  const sorted = Object.entries(metrics.byEndpoint)
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count);
  for (const [ep, s] of sorted) {
    const epAvg = (s.sum / s.count).toFixed(0) + 'ms';
    const okPct = ((s.ok / s.count) * 100).toFixed(0) + '%';
    const epMax = s.max + 'ms';
    console.log(`  ${ep.padEnd(34)} ${String(s.count).padStart(6)} ${okPct.padStart(6)} ${epAvg.padStart(7)} ${epMax.padStart(7)}`);
  }
  console.log('');

  if (Object.keys(metrics.errorMessages).length > 0) {
    console.log('  Error types:');
    for (const [msg, count] of Object.entries(metrics.errorMessages).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${msg.padEnd(20)} ${count}`);
    }
    console.log('');
  }

  // Grade based on p95 + error rate
  const p95 = pct(d, 95);
  const errN = Number(errPct);
  let grade, verdict;
  if      (p95 <  200 && errN < 1)  { grade = 'A+'; verdict = 'Excellent — no degradation under 750 VUs'; }
  else if (p95 <  400 && errN < 1)  { grade = 'A';  verdict = 'Very good — handles load with minimal latency'; }
  else if (p95 <  800 && errN < 2)  { grade = 'B';  verdict = 'Good — some latency increase, no errors'; }
  else if (p95 < 1500 && errN < 5)  { grade = 'C';  verdict = 'Fair — noticeable slowdown under full load'; }
  else if (p95 < 3000 && errN < 10) { grade = 'D';  verdict = 'Poor — significant degradation'; }
  else                               { grade = 'F';  verdict = 'Critical — server struggling under load'; }

  console.log(`  Grade : ${grade}`);
  console.log(`  Verdict: ${verdict}`);
  console.log(line + '\n');

  // Bottleneck hints
  const slowest = sorted[0];
  if (slowest) {
    const sAvg = (slowest[1].sum / slowest[1].count).toFixed(0);
    console.log(`  Slowest endpoint: ${slowest[0]} (avg ${sAvg}ms)`);
  }
  if (p95 > 500) {
    console.log('  Tip: High p95 → check DB connection pool size (DB_POOL_MAX), add indexes,');
    console.log('       or enable query result caching for read-heavy endpoints.');
  }
  if (errN > 5) {
    console.log('  Tip: High error rate → check THROTTLE_LIMIT env var, connection limits,');
    console.log('       or server memory/CPU under load.');
  }
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
