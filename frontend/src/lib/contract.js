import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

// CommonsTide reads the live Intelligent Contract directly and writes through
// the user's own wallet. The contract is the only backend; there is no server.
export const CONTRACT_ADDRESS = '0x18c47fFbA8a2602606213258f04875607EC01645';
export const DEPLOY_TX = '0x5ae7e5a090dd41d2a901907923a437974d815cba074547c4cd2e32919642d838';
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';
export const RPC_URL = 'https://rpc-bradbury.genlayer.com';
export const NETWORK_NAME = 'Bradbury';
export const CHAIN_ID = 4221;
export const CHAIN_ID_HEX = '0x107D';

export const addressUrl = (addr) => `${EXPLORER}/address/${addr}`;
export const txUrl = (hash) => `${EXPLORER}/tx/${hash}`;

export const readClient = createClient({ chain: testnetBradbury });
export const makeWalletClient = (account) => createClient({ chain: testnetBradbury, account });

// Fairness bands the contract derives, with display metadata.
export const BANDS = {
  balanced: { key: 'balanced', label: 'Balanced', color: '#7AE582', glow: 'rgba(122, 229, 130, 0.45)' },
  minor_pressure: { key: 'minor_pressure', label: 'Minor pressure', color: '#FFD166', glow: 'rgba(255, 209, 102, 0.4)' },
  needs_rebalance: { key: 'needs_rebalance', label: 'Needs rebalance', color: '#FF9F45', glow: 'rgba(255, 159, 69, 0.4)' },
  constraint_violation: { key: 'constraint_violation', label: 'Constraint violation', color: '#FF5C77', glow: 'rgba(255, 92, 119, 0.45)' },
};
export const bandOf = (b) => BANDS[String(b)] || BANDS.needs_rebalance;

export const URGENCIES = [
  { key: 'blocker', label: 'Blocker', color: '#FF5C77' },
  { key: 'high', label: 'High', color: '#FFD166' },
  { key: 'medium', label: 'Medium', color: '#3A8DFF' },
  { key: 'low', label: 'Low', color: '#789391' },
];
export const urgencyOf = (u) => URGENCIES.find((x) => x.key === String(u)) || URGENCIES[2];

export async function withRpcRetry(fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|ECONN|503|502|gateway/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
  throw last;
}

// ----- value coercion (the SDK returns Map / bigint shapes) -----------------

function asNumber(v) {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asString(v) {
  return v === undefined || v === null ? '' : String(v);
}
function asBool(v) {
  return v === true || v === 'true' || v === 1;
}
function pick(obj, key) {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return obj[key];
  return undefined;
}
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v instanceof Map) return Array.from(v.values());
  return [];
}
function toPlain(v) {
  if (v instanceof Map) {
    const o = {};
    for (const [k, val] of v.entries()) o[k] = toPlain(val);
    return o;
  }
  if (Array.isArray(v)) return v.map(toPlain);
  if (typeof v === 'bigint') return Number(v);
  return v;
}

// ----- normalizers ----------------------------------------------------------

export function normRequest(raw) {
  return {
    id: asString(pick(raw, 'id')),
    name: asString(pick(raw, 'name')),
    requested: asNumber(pick(raw, 'requested')),
    urgency: asString(pick(raw, 'urgency')) || 'medium',
    minUseful: asNumber(pick(raw, 'minUseful')),
    reason: asString(pick(raw, 'reason')),
    by: asString(pick(raw, 'by')),
  };
}

export function normAllocation(raw) {
  if (!raw) return null;
  const a = toPlain(raw);
  if (!a || !a.band) return null;
  return {
    band: asString(a.band),
    rows: asArray(a.rows).map((row) => ({
      id: asString(pick(row, 'id')),
      name: asString(pick(row, 'name')),
      requested: asNumber(pick(row, 'requested')),
      granted: asNumber(pick(row, 'granted')),
      urgency: asString(pick(row, 'urgency')) || 'medium',
      belowMinUseful: asBool(pick(row, 'belowMinUseful')),
      reason: asString(pick(row, 'reason')),
    })),
    grantedSum: asNumber(a.grantedSum),
    spendable: asNumber(a.spendable),
    reserve: asNumber(a.reserve),
    reserveIntact: asBool(a.reserveIntact),
    reserveHealth: asNumber(a.reserveHealth),
    totalRequested: asNumber(a.totalRequested),
    unmet: asNumber(a.unmet),
    coverage: asNumber(a.coverage),
    blockersServed: asBool(a.blockersServed),
    note: asString(a.note),
    round: asNumber(a.round),
  };
}

export function normPoolSummary(raw) {
  return {
    id: asString(pick(raw, 'id')),
    title: asString(pick(raw, 'title')),
    unit: asString(pick(raw, 'unit')) || 'units',
    total: asNumber(pick(raw, 'total')),
    reserve: asNumber(pick(raw, 'reserve')),
    spendable: asNumber(pick(raw, 'spendable')),
    principles: asString(pick(raw, 'principles')),
    status: asString(pick(raw, 'status')),
    requestCount: asNumber(pick(raw, 'requestCount')),
    roundCount: asNumber(pick(raw, 'roundCount')),
    steward: asString(pick(raw, 'steward')),
    proofHash: asString(pick(raw, 'proofHash')),
    seq: asNumber(pick(raw, 'seq')),
    requests: [],
    allocation: null,
  };
}

export function normPool(raw) {
  const base = normPoolSummary(raw);
  base.requests = asArray(pick(raw, 'requests')).map(normRequest);
  base.allocation = normAllocation(pick(raw, 'allocation'));
  return base;
}

// ----- view reads -----------------------------------------------------------

async function readView(functionName, args = []) {
  return withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName, args }));
}

export async function fetchPools(limit = 40) {
  const out = [];
  let start = 0;
  for (let guard = 0; guard < 200; guard += 1) {
    const page = asArray(await readView('get_pools', [start])).map(normPoolSummary);
    out.push(...page);
    if (page.length < 20 || out.length >= limit) break;
    start += page.length;
  }
  return out.slice(0, limit);
}

export async function fetchPool(id) {
  return normPool(await readView('get_pool', [id]));
}

export async function fetchStats() {
  const raw = toPlain(await readView('get_stats'));
  return {
    pools: asNumber(raw.pools),
    rounds: asNumber(raw.rounds),
    settled: asNumber(raw.settled),
  };
}
