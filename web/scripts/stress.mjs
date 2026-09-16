const base = process.env.STRESS_BASE_URL ?? "http://localhost:3000";
const concurrency = Number(process.env.STRESS_CONCURRENCY ?? 40);
const rounds = Number(process.env.STRESS_ROUNDS ?? 3);

const targets = [
  { name: "login público", path: "/login", expect: [200] },
  { name: "panel sin sesión", path: "/inventario", expect: [307, 302, 303] },
  { name: "export sin sesión", path: "/api/export", expect: [307, 302, 303, 401] },
];

async function hit(path) {
  const started = performance.now();
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  return { status: res.status, ms: performance.now() - started };
}

function pct(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function probe() {
  try {
    const res = await fetch(`${base}/login`, { redirect: "manual" });
    return res.ok || res.status === 307;
  } catch {
    return false;
  }
}

async function barrage(path, n) {
  const jobs = Array.from({ length: n }, () => hit(path));
  return Promise.all(jobs);
}

const up = await probe();
if (!up) {
  console.log(`SKIP stress: no hay servidor en ${base}`);
  process.exit(0);
}

let failed = 0;
for (const target of targets) {
  const samples = [];
  for (let round = 0; round < rounds; round += 1) {
    const batch = await barrage(target.path, concurrency);
    samples.push(...batch);
  }
  const unexpected = samples.filter((s) => !target.expect.includes(s.status));
  const times = samples.map((s) => s.ms);
  console.log(
    `${target.name}: ${samples.length} req · p50 ${pct(times, 50).toFixed(0)}ms · p95 ${pct(times, 95).toFixed(0)}ms · errores ${unexpected.length}`,
  );
  if (unexpected.length) {
    failed += 1;
    console.error(`  estados raros: ${[...new Set(unexpected.map((s) => s.status))].join(", ")}`);
  }
}

if (failed) process.exit(1);
console.log("stress ok");
