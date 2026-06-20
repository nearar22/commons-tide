import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Waves, Plus, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button, EmptyState } from '../components/ui.jsx';
import { BasinCanvas } from '../components/BasinCanvas.jsx';
import { useSharedWallet, useToast } from '../App.jsx';
import { useTideActions } from '../hooks/useTideActions.js';
import { fetchPool, bandOf, urgencyOf, txUrl } from '../lib/contract.js';
import styles from './TidePool.module.css';

const URGENCY_OPTIONS = ['blocker', 'high', 'medium', 'low'];
const EASE = [0.16, 1, 0.3, 1];

export function TidePool() {
  const { id } = useParams();
  const wallet = useSharedWallet();
  const { pushToast } = useToast();
  const actions = useTideActions({ wallet });

  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // request form
  const [name, setName] = useState('');
  const [requested, setRequested] = useState('');
  const [urgency, setUrgency] = useState('high');
  const [minUseful, setMinUseful] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const p = await fetchPool(id);
      setPool(p && p.id ? p : null);
    } catch {
      setPool((prev) => prev);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load, tick]);

  const refresh = () => setTick((t) => t + 1);
  const busy = actions.phase === 'wallet' || actions.phase === 'working';

  if (loading && !pool) {
    return <EmptyState title="Reading the basin from the chain...">One moment.</EmptyState>;
  }
  if (!pool) {
    return (
      <EmptyState title="Pool not found" action={<Button to="/chronicle" variant="ghost" icon={ArrowLeft}>Back to the chronicle</Button>}>
        This pool is not on the contract.
      </EmptyState>
    );
  }

  const alloc = pool.allocation;
  const band = alloc ? bandOf(alloc.band) : null;
  const fill = pool.total > 0 ? Math.max(0, (pool.total - pool.reserve)) / pool.total : 0;
  const reserveFrac = pool.total > 0 ? pool.reserve / pool.total : 0;
  const settled = pool.status === 'settled';
  const isSteward = wallet.address && wallet.address.toLowerCase() === pool.steward.toLowerCase();

  const submitRequest = async (e) => {
    e.preventDefault();
    const reqNum = Number(requested);
    if (!name.trim() || !reason.trim() || !(reqNum > 0)) {
      pushToast({ tone: 'warning', title: 'Request incomplete', message: 'Give a name, a positive amount, and a written reason.' });
      return;
    }
    const minNum = Number(minUseful) || 0;
    const res = await actions.run('submit_request', [pool.id, name.trim(), reqNum, urgency, minNum, reason.trim()]);
    if (!res.ok) {
      if (actions.error) pushToast({ tone: 'error', title: 'Request rejected', message: actions.error });
      else if (res.needWallet) pushToast({ tone: 'info', title: 'Connect your wallet' });
      return;
    }
    pushToast({ tone: 'success', title: 'Request added', message: `${name.trim()} joined the basin.` });
    setName(''); setRequested(''); setMinUseful(''); setReason(''); setUrgency('high');
    refresh();
  };

  const runTide = async () => {
    const res = await actions.run('run_allocation', [pool.id]);
    if (!res.ok) {
      if (actions.error) pushToast({ tone: 'error', title: 'Tide failed', message: actions.error });
      else if (res.needWallet) pushToast({ tone: 'info', title: 'Connect your wallet' });
      return;
    }
    pushToast({ tone: 'success', title: 'Tide complete', message: 'The allocator divided the pool. Read the result below.' });
    refresh();
  };

  const settle = async () => {
    const res = await actions.run('settle_pool', [pool.id]);
    if (!res.ok) {
      if (actions.error) pushToast({ tone: 'error', title: 'Cannot settle', message: actions.error });
      return;
    }
    pushToast({ tone: 'success', title: 'Pool settled', message: 'A continuity proof was minted.' });
    refresh();
  };

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <Button to="/chronicle" variant="quiet" size="md" icon={ArrowLeft}>Chronicle</Button>
        <span className={styles.statusPill} data-status={pool.status}>{pool.status.replace('_', ' ')}</span>
      </div>

      <header className={styles.header}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{pool.title}</h1>
          <p className={styles.sub}>
            {pool.total} {pool.unit} total, {pool.reserve} reserved, {pool.spendable} {pool.unit} spendable.
            {' '}{pool.requestCount} request{pool.requestCount === 1 ? '' : 's'}, {pool.roundCount} tide{pool.roundCount === 1 ? '' : 's'} run.
          </p>
          {pool.principles ? (
            <div className={styles.principles}>
              <span className="ct-eyebrow">Community principles</span>
              <p>{pool.principles}</p>
            </div>
          ) : null}
        </div>
        <div className={styles.headBasin}>
          <BasinCanvas fill={fill} reserve={reserveFrac} height={220} band={alloc ? alloc.band : 'balanced'} />
        </div>
      </header>

      <div className={styles.cols}>
        {/* Left: requests + add */}
        <section className={styles.colMain}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>Request islands</h2>
            <span className={styles.count}>{pool.requests.length}</span>
          </div>

          {pool.requests.length === 0 ? (
            <EmptyState title="No requests yet">Add the first request below to start the tide.</EmptyState>
          ) : (
            <ul className={styles.islands}>
              {pool.requests.map((r, i) => {
                const u = urgencyOf(r.urgency);
                const row = alloc ? alloc.rows.find((x) => x.id === r.id) : null;
                const grantedPct = r.requested > 0 && row ? Math.round((row.granted / r.requested) * 100) : 0;
                return (
                  <motion.li key={r.id} className={styles.island}
                    style={{ borderLeftColor: u.color }}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}>
                    <div className={styles.islandTop}>
                      <span className={styles.islandName}>{r.name}</span>
                      <span className={styles.urgency} style={{ color: u.color, borderColor: u.color }}>{u.label}</span>
                    </div>
                    <p className={styles.islandReason}>{r.reason}</p>
                    {row ? (
                      <div className={styles.fillRow}>
                        <div className={styles.fillTrack} aria-hidden="true">
                          <motion.span className={styles.fillBar}
                            style={{ background: row.granted > 0 ? `linear-gradient(90deg, var(--current-blue), var(--lagoon-cyan))` : 'var(--bg-inset)' }}
                            initial={{ width: 0 }} animate={{ width: `${grantedPct}%` }}
                            transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.05 }} />
                        </div>
                        <span className={styles.fillLabel} style={{ color: row.granted > 0 ? 'var(--kelp-green)' : 'var(--text-muted)' }}>
                          {row.granted} / {r.requested}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.islandMeta}>
                        <span>wants <strong>{r.requested}</strong> {pool.unit}</span>
                        {r.minUseful > 0 ? <span>min useful {r.minUseful}</span> : null}
                      </div>
                    )}
                    {row && row.belowMinUseful ? <p className={styles.belowMin}>Below this requester's minimum useful amount, so it was dropped to zero.</p> : null}
                    {row && row.reason ? <p className={styles.grantReason}>{row.reason}</p> : null}
                  </motion.li>
                );
              })}
            </ul>
          )}

          {!settled ? (
            <form className={styles.addForm} onSubmit={submitRequest}>
              <h3 className={styles.addTitle}><Plus size={16} aria-hidden="true" /> Add a request</h3>
              <div className={styles.addRow}>
                <input className={styles.input} placeholder="Name or role" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={styles.input} type="number" min="1" placeholder={`Amount (${pool.unit})`} value={requested} onChange={(e) => setRequested(e.target.value)} />
              </div>
              <div className={styles.addRow}>
                <select className={styles.input} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input className={styles.input} type="number" min="0" placeholder="Min useful (optional)" value={minUseful} onChange={(e) => setMinUseful(e.target.value)} />
              </div>
              <textarea className={styles.input} rows={2} placeholder="Why does this need the resource? Be specific." value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button type="submit" variant="ghost" icon={Plus} disabled={busy}>{busy ? (actions.status || 'Working...') : 'Add request'}</Button>
            </form>
          ) : null}
        </section>

        {/* Right: tide engine + result */}
        <aside className={styles.colSide}>
          <div className={styles.engine}>
            <h2 className={styles.h2}>Tide engine</h2>
            {!settled ? (
              <Button variant="primary" icon={Waves} onClick={runTide} disabled={busy || pool.requests.length === 0} full>
                {busy && actions.phase === 'working' ? (actions.status || 'Running tide...') : alloc ? 'Re-run the tide' : 'Run the tide'}
              </Button>
            ) : null}
            {busy ? <p className={styles.busyNote}>An allocation run is an AI write under consensus. It takes a minute or more.</p> : null}

            {alloc ? (
              <div className={styles.result}>
                <div className={styles.band} style={{ color: band.color, borderColor: band.color }}>{band.label}</div>
                <div className={styles.readings}>
                  <div><span>Granted</span><strong>{alloc.grantedSum} / {alloc.spendable}</strong></div>
                  <div><span>Coverage</span><strong>{alloc.coverage}%</strong></div>
                  <div><span>Unmet need</span><strong>{alloc.unmet}</strong></div>
                  <div><span>Reserve</span><strong style={{ color: alloc.reserveIntact ? 'var(--kelp-green)' : 'var(--blocked-coral)' }}>{alloc.reserveIntact ? 'intact' : 'breached'}</strong></div>
                </div>
                {alloc.note ? <p className={styles.note}>{alloc.note}</p> : null}

                {!settled ? (
                  isSteward ? (
                    <Button variant="primary" icon={ShieldCheck} onClick={settle} disabled={busy || alloc.band === 'needs_rebalance' || alloc.band === 'constraint_violation'} full>
                      Settle this tide
                    </Button>
                  ) : (
                    <p className={styles.stewardNote}>Only the steward can settle this pool.</p>
                  )
                ) : null}
              </div>
            ) : (
              <p className={styles.idleNote}>No tide has run yet. Add requests, then run the tide to see the allocator divide the pool.</p>
            )}
          </div>

          {settled && pool.proofHash ? (
            <div className={styles.proof}>
              <span className="ct-eyebrow">Settlement proof</span>
              <code className="ct-mono">{pool.proofHash}</code>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
