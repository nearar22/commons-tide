import { motion } from 'framer-motion';
import { ArrowRight, ScrollText, Scale, ShieldCheck, Waves, Anchor, GitBranch } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import { BasinCanvas } from '../components/BasinCanvas.jsx';
import { useCommons } from '../hooks/useCommons.js';
import { CONTRACT_ADDRESS } from '../lib/contract.js';
import styles from './HarborGate.module.css';

const EASE = [0.16, 1, 0.3, 1];

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

export function HarborGate() {
  const { stats } = useCommons();

  return (
    <div className={styles.page}>
      {/* Hero: split. Statement left, live basin right. */}
      <section className={styles.hero}>
        <motion.div className={styles.heroText}
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
          <motion.p className="ct-eyebrow" variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>Semantic resource tide protocol</motion.p>
          <motion.h1 className={styles.headline} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>
            Let shared resources <span className={styles.accent}>flow fairly.</span>
          </motion.h1>
          <motion.p className={styles.sub} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
            CommonsTide turns needs, urgencies, and written community principles into a transparent
            allocation tide. An allocator on GenLayer divides a scarce pool, and a conservation engine
            enforces the budget on-chain so the water never overspills.
          </motion.p>
          <motion.div className={styles.cta} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
            <Button to="/basin" variant="primary" size="lg" iconRight={ArrowRight}>Open a pool</Button>
            <Button to="/chronicle" variant="ghost" size="lg" icon={ScrollText}>View the tide chronicle</Button>
          </motion.div>
          <motion.dl className={styles.heroStats} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
            <div><dt>Pools opened</dt><dd>{stats.pools}</dd></div>
            <div><dt>Tides run</dt><dd>{stats.rounds}</dd></div>
            <div><dt>Settled</dt><dd>{stats.settled}</dd></div>
          </motion.dl>
        </motion.div>
        <motion.aside className={styles.heroBasin}
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
          <BasinCanvas fill={0.66} reserve={0.2} height={360} band="balanced" />
          <div className={styles.basinLabels}>
            <span><span className={styles.dot} style={{ background: 'var(--current-blue)' }} /> Spendable pool</span>
            <span><span className={styles.dot} style={{ background: 'var(--lagoon-cyan)' }} /> Protected reserve</span>
          </div>
        </motion.aside>
      </section>

      {/* Why equal split is unfair: asymmetric thesis + stacked reasons */}
      <Reveal>
        <section className={styles.thesis}>
          <aside className={styles.thesisHead}>
            <h2 className={styles.h2}>Why equal split is often unfair</h2>
            <p className={styles.lead}>
              Dividing a pool evenly ignores who is blocked, who can wait, and what the community
              promised to protect. Fairness under scarcity is a judgment, not an average.
            </p>
          </aside>
          <ol className={styles.reasons}>
            {[
              { icon: Scale, t: 'Need is not uniform', b: 'A blocked contributor and a flexible nice-to-have are not the same claim on the pool, even when the numbers match.' },
              { icon: ShieldCheck, t: 'Some capacity is promised', b: 'An emergency reserve or a newcomer set-aside is a constraint the allocation must honor, not a suggestion.' },
              { icon: Waves, t: 'Pressure must stay visible', b: 'When demand exceeds supply, the system should show the pressure and delay the flexible, not silently shortchange the urgent.' },
            ].map((r) => (
              <li key={r.t} className={styles.reason}>
                <span className={styles.reasonIcon} aria-hidden="true"><r.icon size={18} /></span>
                <div><h3 className={styles.reasonTitle}>{r.t}</h3><p className={styles.reasonBody}>{r.b}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      {/* Why GenLayer is essential */}
      <Reveal>
        <section className={styles.section}>
          <h2 className={styles.h2}>Why GenLayer is essential</h2>
          <p className={styles.lead}>
            A normal contract can check a quota or a balance. It cannot read whether a request is truly
            urgent, whether an allocation honors a written principle, or whether a group is being
            quietly deprioritized. GenLayer makes that allocation judgment under validator consensus,
            and the result is the on-chain settlement, not an off-chain opinion.
          </p>
          <div className={styles.pillars}>
            <article className={styles.pillar}>
              <span className={styles.pillarTag}>The allocator</span>
              <p>An AI divides the spendable pool across competing requests under the community principles, with a one-line reason per grant.</p>
            </article>
            <article className={styles.pillar}>
              <span className={styles.pillarTag}>The conservation engine</span>
              <p>Deterministic code re-runs after consensus: it clamps every grant to what was asked, blocks any allocation that overspends or touches the reserve, and re-derives the fairness band.</p>
            </article>
            <article className={styles.pillar}>
              <span className={styles.pillarTag}>The settlement</span>
              <p>A steward can settle only a balanced tide whose reserve is intact. The contract mints a proof over the settled division.</p>
            </article>
          </div>
        </section>
      </Reveal>

      {/* From requests to settlement: horizontal flow */}
      <Reveal>
        <section className={styles.section}>
          <h2 className={styles.h2}>From requests to settlement</h2>
          <div className={styles.flow}>
            {[
              { n: '01', icon: Anchor, t: 'Open a pool', b: 'Set the total, a protected reserve, and the community principles.' },
              { n: '02', icon: GitBranch, t: 'Gather requests', b: 'Members submit an amount, an urgency, a minimum useful amount, and a reason.' },
              { n: '03', icon: Waves, t: 'Run the tide', b: 'The allocator divides the pool; the engine enforces the budget on-chain.' },
              { n: '04', icon: ShieldCheck, t: 'Settle', b: 'A balanced, reserve-intact tide settles with a continuity proof.' },
            ].map((s) => (
              <div key={s.n} className={styles.flowStep}>
                <span className={styles.flowNum}>{s.n}</span>
                <span className={styles.flowIcon} aria-hidden="true"><s.icon size={18} /></span>
                <h3 className={styles.flowTitle}>{s.t}</h3>
                <p className={styles.flowBody}>{s.b}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.closing}>
          <h2 className={styles.closingTitle}>Make scarcity visible, negotiable, and fair.</h2>
          <div className={styles.cta}>
            <Button to="/basin" variant="primary" size="lg" iconRight={ArrowRight}>Open the first pool</Button>
          </div>
          <p className={styles.contract}>
            Live contract <code className="ct-mono">{CONTRACT_ADDRESS}</code> on GenLayer Bradbury.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
