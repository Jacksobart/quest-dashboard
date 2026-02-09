import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Boot sequence data
// ---------------------------------------------------------------------------
const BOOT_LINES = [
  { text: 'QUEST SYSTEM v1.0.0', delay: 0, color: 'text-cyan', bold: true },
  { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', delay: 40, color: 'text-border-glow' },
  { text: '', delay: 60 },
  { text: '[BOOT] Initializing quantum verification matrix...', delay: 80, color: 'text-text-dim' },
  { text: '[BOOT] Loading claude-opus-4-6 model weights...', delay: 150, color: 'text-text-dim' },
  { text: '[  OK  ] Model loaded (4.2B parameters)', delay: 280, color: 'text-emerald' },
  { text: '[BOOT] Mounting filesystem observer...', delay: 360, color: 'text-text-dim' },
  { text: '[  OK  ] Filesystem observer mounted', delay: 440, color: 'text-emerald' },
  { text: '[BOOT] Calibrating DAG scheduler...', delay: 520, color: 'text-text-dim' },
  { text: '[  OK  ] DAG scheduler online (4 batches, 12 missions)', delay: 640, color: 'text-emerald' },
  { text: '[BOOT] Initializing verification harness...', delay: 720, color: 'text-text-dim' },
  { text: '[  OK  ] 22 acceptance criteria loaded', delay: 840, color: 'text-emerald' },
  { text: '[  OK  ] 5 validation gates armed', delay: 920, color: 'text-emerald' },
  { text: '[BOOT] Spawning agent pool...', delay: 1000, color: 'text-text-dim' },
  { text: '  ├─ backend    [READY]', delay: 1080, color: 'text-cyan' },
  { text: '  ├─ frontend   [READY]', delay: 1140, color: 'text-purple' },
  { text: '  ├─ database   [READY]', delay: 1200, color: 'text-amber' },
  { text: '  └─ testing    [READY]', delay: 1260, color: 'text-emerald' },
  { text: '', delay: 1320 },
  { text: '[BOOT] Running pre-flight checks...', delay: 1380, color: 'text-text-dim' },
  { text: '[  OK  ] Spec validated (47 requirements)', delay: 1460, color: 'text-emerald' },
  { text: '[  OK  ] Zero file ownership overlaps', delay: 1520, color: 'text-emerald' },
  { text: '[  OK  ] Drift detection armed', delay: 1580, color: 'text-emerald' },
  { text: '', delay: 1620 },
  { text: '▸ VERIFICATION IS THE MOAT', delay: 1680, color: 'text-cyan', bold: true },
  { text: '', delay: 1740 },
  { text: '[SYSTEM] All systems nominal. Launching dashboard...', delay: 1800, color: 'text-emerald', bold: true },
];

const ASCII_LOGO = `
 ██████╗ ██╗   ██╗███████╗███████╗████████╗
██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝
██║   ██║██║   ██║█████╗  ███████╗   ██║
██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║
╚██████╔╝╚██████╔╝███████╗███████║   ██║
 ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showLogo, setShowLogo] = useState(false);
  const [phase, setPhase] = useState<'logo' | 'boot' | 'done'>('logo');
  const [progressPct, setProgressPct] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  // Phase 1: Show ASCII logo
  useEffect(() => {
    const t = setTimeout(() => setShowLogo(true), 100);
    const t2 = setTimeout(() => setPhase('boot'), 600);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  // Phase 2: Boot sequence lines
  useEffect(() => {
    if (phase !== 'boot') return;

    BOOT_LINES.forEach((line, index) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, index]);
        setProgressPct(Math.round(((index + 1) / BOOT_LINES.length) * 100));
      }, line.delay);
      timerRefs.current.push(t);
    });

    // Complete boot
    const completionTimer = setTimeout(() => {
      setPhase('done');
    }, 2100);
    timerRefs.current.push(completionTimer);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [phase]);

  // Phase 3: Fade out
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(onComplete, 350);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // Skip boot with any key
  const handleSkip = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setPhase('done');
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleSkip);
    window.addEventListener('click', handleSkip);
    return () => {
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('click', handleSkip);
    };
  }, [handleSkip]);

  return (
    <AnimatePresence>
      {phase !== 'done' ? (
        <motion.div
          className="fixed inset-0 z-[9999] bg-void flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* CRT scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
              zIndex: 10,
            }}
          />

          {/* Moving scan line */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,82,82,0.15) 50%, transparent 100%)',
              zIndex: 11,
            }}
            animate={{ top: ['-5%', '105%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, var(--color-void) 100%)',
              zIndex: 5,
            }}
          />

          {/* Content */}
          <div className="relative z-20 w-full max-w-3xl px-8">
            {/* ASCII Logo */}
            <AnimatePresence>
              {showLogo && (
                <motion.pre
                  className="boot-text text-[10px] sm:text-xs leading-tight text-center mb-8 select-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    textShadow: '0 0 20px rgba(255,82,82,0.6), 0 0 40px rgba(255,82,82,0.3)',
                  }}
                >
                  {ASCII_LOGO}
                </motion.pre>
              )}
            </AnimatePresence>

            {/* Boot log */}
            {phase === 'boot' && (
              <div
                ref={containerRef}
                className="font-mono text-[11px] sm:text-xs leading-relaxed max-h-[50vh] overflow-y-auto pr-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {BOOT_LINES.map((line, index) => {
                  if (!visibleLines.includes(index)) return null;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.1 }}
                      className={`${line.color || 'text-text-dim'} ${line.bold ? 'font-bold' : ''}`}
                    >
                      {line.text || '\u00A0'}
                    </motion.div>
                  );
                })}
                {/* Blinking cursor */}
                <span
                  className="inline-block w-2 h-4 bg-cyan ml-1"
                  style={{ animation: 'boot-blink 1s step-end infinite' }}
                />
              </div>
            )}

            {/* Progress bar */}
            {phase === 'boot' && (
              <div className="mt-6">
                <div className="flex justify-between text-[10px] font-mono text-text-dim mb-1">
                  <span>SYSTEM INITIALIZATION</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1 bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))',
                      boxShadow: '0 0 10px var(--color-cyan-glow)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Skip hint */}
            <motion.p
              className="text-center font-mono text-[10px] text-text-dim mt-8 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Press any key to skip
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
