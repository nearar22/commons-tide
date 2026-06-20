import { useRef, useEffect } from 'react';

// The signature visual: a dark civic basin whose water level represents the
// pool. Caustic light ripples across the surface, the protected reserve glows
// as a band at the base, and faint currents drift. DPR-aware, paused when
// hidden, fully static under reduced motion.
export function BasinCanvas({ fill = 0.62, reserve = 0.2, height = 320, band = 'balanced' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, running = true, t = 0;

    const accent = band === 'constraint_violation' ? [255, 92, 119]
      : band === 'needs_rebalance' ? [255, 159, 69]
      : band === 'minor_pressure' ? [255, 209, 102]
      : [69, 240, 223];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function waterY(level) { return h - h * level; }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = accent;

      // Reserve band at the base (protected, luminous)
      const reserveTop = h - h * reserve;
      const rg = ctx.createLinearGradient(0, reserveTop, 0, h);
      rg.addColorStop(0, `rgba(${r},${g},${b},0.05)`);
      rg.addColorStop(1, `rgba(${r},${g},${b},0.22)`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, reserveTop, w, h - reserveTop);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, reserveTop);
      ctx.lineTo(w, reserveTop);
      ctx.stroke();
      ctx.setLineDash([]);

      // Water body up to the fill level with a moving caustic surface
      const top = waterY(fill);
      const wg = ctx.createLinearGradient(0, top, 0, h);
      wg.addColorStop(0, `rgba(58,141,255,0.10)`);
      wg.addColorStop(1, `rgba(11,39,48,0.55)`);
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, top);
      const amp = reduced ? 0 : 6;
      for (let x = 0; x <= w; x += 8) {
        const y = top + Math.sin(x * 0.018 + time * 1.4) * amp + Math.sin(x * 0.05 + time * 0.7) * (amp * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Surface highlight line
      ctx.strokeStyle = `rgba(${r},${g},${b},0.65)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = top + Math.sin(x * 0.018 + time * 1.4) * amp + Math.sin(x * 0.05 + time * 0.7) * (amp * 0.4);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Drifting caustic dots below the surface
      if (!reduced) {
        for (let i = 0; i < 14; i += 1) {
          const px = (i * 73 + time * 18) % w;
          const py = top + 24 + ((i * 37) % Math.max(1, h - top - 30));
          ctx.fillStyle = `rgba(${r},${g},${b},${0.05 + 0.05 * Math.sin(time + i)})`;
          ctx.beginPath();
          ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame() {
      if (!running) return;
      t += 0.016;
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!reduced) { running = true; raf = requestAnimationFrame(frame); }
    };
    document.addEventListener('visibilitychange', onVis);

    if (reduced) draw(0);
    else raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fill, reserve, band]);

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} aria-hidden="true" />;
}
