import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RotateCw, ArrowRight } from 'lucide-react';
import { Button, EmptyState } from '../components/ui.jsx';
import { useCommons } from '../hooks/useCommons.js';
import { bandOf } from '../lib/contract.js';
import styles from './TideChronicle.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'settled', label: 'Settled' },
];

export function TideChronicle() {
  const { pools, stats, loading, error, refresh } = useCommons();
  const [filter, setFilter] = useState('all');

  const shown = pools.filter((p) => {
    if (filter === 'settled') return p.status === 'settled';
    if (filter === 'open') return p.status !== 'settled';
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className="ct-eyebrow">Tide chronicle</p>
          <h1 className={styles.title}>Every tide on the shoreline</h1>
          <p className={styles.lead}>
            {stats.pools} pools opened, {stats.rounds} tides run, {stats.settled} settled. Each tide
            mark is a real allocation recorded on the contract.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="ghost" size="md" icon={RotateCw} onClick={refresh}>Refresh</Button>
          <Button to="/basin" variant="primary" size="md" icon={Plus}>Open a pool</Button>
        </div>
      </header>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={styles.chip} data-active={filter === f.id ? 'true' : 'false'} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading && pools.length === 0 ? (
        <EmptyState title="Reading the shoreline...">Loading pools from the chain.</EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title={pools.length === 0 ? 'No tides yet' : 'No tides match this filter'}
          action={<Button to="/basin" variant="ghost" icon={Plus}>Open the first pool</Button>}>
          {pools.length === 0 ? 'Open a pool and run the first allocation tide.' : 'Try a different filter.'}
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {shown.map((p) => {
            const alloc = p.allocation;
            const band = alloc ? bandOf(alloc.band) : null;
            const fillPct = p.total > 0 ? Math.round(((p.total - p.reserve) / p.total) * 100) : 0;
            return (
              <Link key={p.id} to={`/pool/${p.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.cardStatus} data-status={p.status}>{p.status.replace('_', ' ')}</span>
                  {band ? <span className={styles.cardBand} style={{ color: band.color }}>{band.label}</span> : null}
                </div>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <div className={styles.levelTrack} aria-hidden="true">
                  <span className={styles.levelFill} style={{ width: `${fillPct}%` }} />
                  <span className={styles.levelReserve} style={{ width: `${p.total > 0 ? Math.round((p.reserve / p.total) * 100) : 0}%` }} />
                </div>
                <div className={styles.cardMeta}>
                  <span>{p.total} {p.unit}</span>
                  <span>{p.requestCount} request{p.requestCount === 1 ? '' : 's'}</span>
                  <span>{p.roundCount} tide{p.roundCount === 1 ? '' : 's'}</span>
                </div>
                <span className={styles.cardLink}>Open the basin <ArrowRight size={14} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
