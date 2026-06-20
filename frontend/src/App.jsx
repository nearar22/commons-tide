import { createContext, useCallback, useContext, useMemo, useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Waves, Wallet, LogOut, Copy, Check, ExternalLink, AlertTriangle, Droplets } from 'lucide-react';
import { useWallet } from './hooks/useWallet.js';
import { NETWORK_NAME, CONTRACT_ADDRESS, addressUrl } from './lib/contract.js';
import { HarborGate } from './scenes/HarborGate.jsx';
import { ResourceBasin } from './scenes/ResourceBasin.jsx';
import { TidePool } from './scenes/TidePool.jsx';
import { TideChronicle } from './scenes/TideChronicle.jsx';

// ----- toast context --------------------------------------------------------
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
let toastSeq = 0;

// ----- wallet context (one wallet shared across scenes) ---------------------
const WalletCtx = createContext(null);
export const useSharedWallet = () => useContext(WalletCtx);

const SCENES = [
  { to: '/', label: 'Harbor Gate', end: true },
  { to: '/basin', label: 'Open a Pool' },
  { to: '/chronicle', label: 'Tide Chronicle' },
];

function shorten(a) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ''; }

function WalletButton() {
  const wallet = useSharedWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!wallet.address) {
    return (
      <button type="button" className="ct-btn ct-btn-ghost ct-btn-md" onClick={wallet.connect} disabled={wallet.connecting}>
        <Wallet size={16} aria-hidden="true" />
        <span>{wallet.connecting ? 'Connecting...' : 'Connect wallet'}</span>
      </button>
    );
  }
  if (!wallet.onRightChain) {
    return (
      <button type="button" className="ct-btn ct-btn-ghost ct-btn-md" onClick={wallet.switchChain}>
        <AlertTriangle size={16} aria-hidden="true" />
        <span>Switch to {NETWORK_NAME}</span>
      </button>
    );
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(wallet.address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <div className="ct-wallet" ref={ref}>
      <button type="button" className="ct-btn ct-btn-ghost ct-btn-md" onClick={() => setOpen((o) => !o)}>
        <span className="ct-chain-dot" aria-hidden="true" />
        <span className="ct-mono">{shorten(wallet.address)}</span>
      </button>
      {open ? (
        <div className="ct-wallet-pop" role="menu">
          <p className="ct-wallet-full">{wallet.address}</p>
          <button type="button" className="ct-wallet-item" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy address'}
          </button>
          <a className="ct-wallet-item" href={addressUrl(wallet.address)} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> View on explorer
          </a>
          <button type="button" className="ct-wallet-item" onClick={() => { wallet.disconnect(); setOpen(false); }}>
            <LogOut size={15} /> Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChainBadge() {
  return (
    <a className="ct-chain" href={addressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" title={CONTRACT_ADDRESS}>
      <span className="ct-chain-dot" aria-hidden="true" />
      Live on {NETWORK_NAME}
    </a>
  );
}

export default function App() {
  const wallet = useWallet();
  const location = useLocation();
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    toastSeq += 1;
    const id = toastSeq;
    const entry = { id, tone: 'info', duration: 4600, ...toast };
    setToasts((t) => [...t, entry]);
    if (entry.duration > 0) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), entry.duration);
  }, []);

  const toastValue = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <WalletCtx.Provider value={wallet}>
      <ToastCtx.Provider value={toastValue}>
        <div className="ct-shell">
          <header className="ct-topbar">
            <div className="ct-brand">
              <span className="ct-brand-mark" aria-hidden="true"><Droplets size={17} /></span>
              <div>
                <div className="ct-brand-name">CommonsTide</div>
                <div className="ct-brand-sub">resource tide protocol</div>
              </div>
            </div>
            <nav className="ct-nav" aria-label="Scenes">
              {SCENES.map((s) => (
                <NavLink key={s.to} to={s.to} end={s.end}
                  className={({ isActive }) => 'ct-nav-link'}
                  style={({ isActive }) => undefined}
                  data-active={(s.end ? location.pathname === '/' : location.pathname.startsWith(s.to)) ? 'true' : 'false'}>
                  {s.label}
                </NavLink>
              ))}
            </nav>
            <div className="ct-top-right">
              <ChainBadge />
              <WalletButton />
            </div>
          </header>

          <main className="ct-main">
            <Routes>
              <Route path="/" element={<HarborGate />} />
              <Route path="/basin" element={<ResourceBasin />} />
              <Route path="/pool/:id" element={<TidePool />} />
              <Route path="/chronicle" element={<TideChronicle />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <div className="ct-toasts">
            {toasts.map((t) => (
              <div key={t.id} className="ct-toast" data-tone={t.tone}>
                <div className="ct-toast-title">{t.title}</div>
                {t.message ? <div className="ct-toast-msg">{t.message}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </ToastCtx.Provider>
    </WalletCtx.Provider>
  );
}
