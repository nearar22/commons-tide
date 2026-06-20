import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import { BasinCanvas } from '../components/BasinCanvas.jsx';
import { useSharedWallet, useToast } from '../App.jsx';
import { useTideActions } from '../hooks/useTideActions.js';
import { fetchPools } from '../lib/contract.js';
import styles from './ResourceBasin.module.css';

const PRESETS = [
  { label: 'Mentorship hours', unit: 'hours', total: 80, reserve: 16,
    principles: 'Prioritize blocked work. Reserve support for newcomers. Do not overload any one mentor. Keep the emergency reserve protected. Reward contributors who help others. Delay flexible low-priority requests rather than rejecting them.' },
  { label: 'Treasury budget', unit: 'USDC', total: 50000, reserve: 10000,
    principles: 'Fund maintenance of public goods first. Protect the emergency reserve. Favor work that unblocks others. Treat speculative requests as flexible. Do not concentrate the budget in one team.' },
  { label: 'Review capacity', unit: 'reviews', total: 40, reserve: 8,
    principles: 'Prioritize security-critical reviews. Keep capacity for urgent incident reviews. Spread the load so no reviewer is overloaded. Delay low-risk cosmetic reviews.' },
];

export function ResourceBasin() {
  const navigate = useNavigate();
  const wallet = useSharedWallet();
  const { pushToast } = useToast();
  const actions = useTideActions({ wallet });

  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('hours');
  const [total, setTotal] = useState(80);
  const [reserve, setReserve] = useState(16);
  const [principles, setPrinciples] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const spendable = Math.max(0, Number(total) - Number(reserve));
  const fill = total > 0 ? Math.min(1, spendable / total) : 0;
  const reserveFrac = total > 0 ? Math.min(1, Number(reserve) / total) : 0;

  const applyPreset = (p) => {
    setTitle(p.label + ' tide');
    setUnit(p.unit); setTotal(p.total); setReserve(p.reserve); setPrinciples(p.principles);
  };

  const canSubmit = title.trim() && unit.trim() && Number(total) > 0 && Number(reserve) >= 0 && Number(reserve) < Number(total) && principles.trim().length > 10;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      pushToast({ tone: 'warning', title: 'Pool incomplete', message: 'Give it a title, a positive total, a reserve below the total, and written principles.' });
      return;
    }
    setSubmitting(true);
    const res = await actions.run('open_pool', [title.trim(), unit.trim(), Number(total), Number(reserve), principles.trim()]);
    if (!res.ok) {
      if (actions.error) pushToast({ tone: 'error', title: 'Could not open the pool', message: actions.error });
      else if (res.needWallet) pushToast({ tone: 'info', title: 'Connect your wallet', message: 'A wallet on Bradbury is needed to open a pool.' });
      setSubmitting(false);
      return;
    }
    pushToast({ tone: 'success', title: 'Pool opened', message: 'Your basin is filling. Add requests next.' });
    try {
      const pools = await fetchPools(40);
      if (pools[0]) { navigate(`/pool/${pools[0].id}`); return; }
    } catch { /* fall through */ }
    setSubmitting(false);
    navigate('/chronicle');
  };

  const busy = submitting || actions.phase === 'wallet' || actions.phase === 'working';

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="ct-eyebrow">Resource basin</p>
        <h1 className={styles.title}>Fill a civic basin</h1>
        <p className={styles.lead}>
          Define the shared pool, protect an emergency reserve, and write the principles the
          allocator must honor. The water level shows what is spendable after the reserve.
        </p>
      </header>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.presets}>
            <span className={styles.presetLabel}>Start from a preset</span>
            <div className={styles.presetChips}>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className={styles.chip} onClick={() => applyPreset(p)}>{p.label}</button>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Pool title</span>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is being shared?" />
          </label>

          <div className={styles.row3}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Unit</span>
              <input className={styles.input} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="hours" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Total amount</span>
              <input className={styles.input} type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Emergency reserve</span>
              <input className={styles.input} type="number" min="0" value={reserve} onChange={(e) => setReserve(e.target.value)} />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Community principles</span>
            <textarea className={styles.textarea} rows={6} value={principles} onChange={(e) => setPrinciples(e.target.value)}
              placeholder="The fairness rules the allocator must honor: who to prioritize, what to protect, what can wait." />
          </label>

          <div className={styles.submitRow}>
            <span className={styles.spendNote}>
              <b>{spendable} {unit}</b> spendable, <i>{reserve} {unit}</i> protected
            </span>
            <Button type="submit" variant="primary" iconRight={ArrowRight} disabled={!canSubmit || busy}>
              {busy ? (actions.status || 'Opening...') : 'Open the pool'}
            </Button>
          </div>
          {busy ? <p className={styles.busyNote}>Opening a pool is an on-chain write. It can take a minute to confirm.</p> : null}
        </form>

        <aside className={styles.preview}>
          <div className={styles.basinWrap}>
            <BasinCanvas fill={fill} reserve={reserveFrac} height={300} band="balanced" />
          </div>
          <div className={styles.previewMeta}>
            <div><span>Total</span><strong>{total} {unit}</strong></div>
            <div><span>Spendable</span><strong style={{ color: 'var(--current-blue)' }}>{spendable} {unit}</strong></div>
            <div><span>Protected reserve</span><strong style={{ color: 'var(--lagoon-cyan)' }}>{reserve} {unit}</strong></div>
          </div>
          <div className={styles.principlePeek}>
            <span className="ct-eyebrow">Principles the allocator honors</span>
            <p>{principles || 'No principles written yet. Without them the allocator has no fairness rules to follow.'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
