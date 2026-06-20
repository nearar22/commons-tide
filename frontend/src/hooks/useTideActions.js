import { useCallback, useRef, useState } from 'react';
import { makeWalletClient, CONTRACT_ADDRESS } from '../lib/contract.js';
import { pollUntilDecided } from '../lib/tx.js';

function friendlyError(e) {
  const s = String(e && e.message ? e.message : e);
  if (/user rejected|denied/i.test(s)) return 'You declined the signature request.';
  if (/LackOfFundForMaxFee|insufficient/i.test(s)) return 'Wallet balance is below the write fee reserve. Claim test GEN and retry.';
  if (/rate limit|429/i.test(s)) return 'The network is busy. Wait a moment and retry.';
  return s.replace(/^\[[A-Z_]+\]\s*/, '') || 'The transaction could not be completed.';
}

// Drives every on-chain write (open_pool, submit_request, run_allocation,
// settle_pool) through the user's wallet, surfacing the live status while a
// transaction is decided. Allocation runs are AI writes and take minutes.
export function useTideActions({ wallet, pausePolling, resumePolling } = {}) {
  const [phase, setPhase] = useState('idle'); // idle | wallet | working | error
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const busy = useRef(false);

  const reset = useCallback(() => {
    busy.current = false;
    setPhase('idle');
    setStatus('');
    setError(null);
  }, []);

  const run = useCallback(
    async (functionName, args) => {
      if (busy.current) return { ok: false };
      if (!wallet?.address) {
        await wallet?.connect?.();
        return { ok: false, needWallet: true };
      }
      busy.current = true;
      pausePolling?.();
      setError(null);
      setPhase('wallet');
      setStatus('PENDING');
      const client = makeWalletClient(wallet.address);
      let hash = null;
      try {
        hash = await client.writeContract({ address: CONTRACT_ADDRESS, functionName, args, value: 0n });
      } catch (e) {
        if (/user rejected|denied|LackOfFundForMaxFee|insufficient/i.test(String(e))) {
          setPhase('error');
          setError(friendlyError(e));
          busy.current = false;
          resumePolling?.();
          return { ok: false };
        }
        // Non-fatal: the tx may still be live; fall through to status polling.
      }
      setPhase('working');
      if (hash) {
        await pollUntilDecided(client, hash, (s) => setStatus(s));
      }
      busy.current = false;
      setPhase('idle');
      resumePolling?.();
      return { ok: true, hash };
    },
    [wallet, pausePolling, resumePolling],
  );

  return { phase, status, error, reset, run };
}
