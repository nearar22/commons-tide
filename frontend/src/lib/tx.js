// Transaction status decoding for GenLayer writes. The SDK can throw while
// parsing a receipt even though the transaction is live, so callers confirm
// success by re-reading contract state; this surfaces the live status name.

const STATUS_NAME = {
  '0': 'UNINITIALIZED', '1': 'PENDING', '2': 'PROPOSING', '3': 'COMMITTING',
  '4': 'REVEALING', '5': 'ACCEPTED', '6': 'UNDETERMINED', '7': 'FINALIZED',
  '8': 'CANCELED', '12': 'VALIDATORS_TIMEOUT', '13': 'LEADER_TIMEOUT', '14': 'ACTIVATED',
};

export const statusName = (s) => {
  if (s === undefined || s === null) return 'PENDING';
  return STATUS_NAME[String(s)] || String(s).toUpperCase();
};

const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);
export const isTerminal = (name) => TERMINAL.has(name);

export async function pollUntilDecided(client, hash, onUpdate, opts = {}) {
  const { tries = 90, intervalMs = 6000 } = opts;
  for (let i = 0; i < tries; i += 1) {
    const tx = await client.getTransaction({ hash }).catch(() => null);
    const status = statusName(tx ? tx.status : 'PENDING');
    onUpdate?.(status);
    if (TERMINAL.has(status)) return { status, tx };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: 'TIMEOUT' };
}
