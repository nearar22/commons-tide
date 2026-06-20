import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPools, fetchStats } from '../lib/contract.js';

// Loads the list of pools plus headline stats from the chain, then refreshes on
// a slow background interval. Polling pauses while a write is in flight so it
// does not fight the transaction confirmation.
export function useCommons(pollMs = 90000) {
  const [pools, setPools] = useState([]);
  const [stats, setStats] = useState({ pools: 0, rounds: 0, settled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);
  const paused = useRef(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [ps, st] = await Promise.all([fetchPools(40), fetchStats()]);
      if (!mounted.current) return;
      setPools(ps);
      setStats(st);
      setError(null);
      setLastUpdated(Date.now());
    } catch {
      if (mounted.current) setError('The basin could not be read from the chain. Retrying shortly.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(false);
    const id = setInterval(() => {
      if (!paused.current) load(true);
    }, pollMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load, pollMs]);

  const pausePolling = useCallback(() => { paused.current = true; }, []);
  const resumePolling = useCallback(() => { paused.current = false; }, []);

  return { pools, stats, loading, error, lastUpdated, refresh: () => load(true), pausePolling, resumePolling };
}
